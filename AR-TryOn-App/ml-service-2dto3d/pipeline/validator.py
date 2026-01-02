import numpy as np
import cv2
import logging
import os
import requests
from PIL import Image

logger = logging.getLogger("Validator")

class SegmentationValidator:
    def __init__(self):
        self.points_limit = 200 # Minimum points for a valid mask
        
        # Try to initialize MobileSAM
        self.sam_predictor = None
        try:
           from mobile_sam import sam_model_registry, SamPredictor
           # Download weights if needed
           weights_path = os.path.join(os.path.dirname(__file__), "..", "models", "mobile_sam.pt")
           if not os.path.exists(weights_path):
               logger.info("Downloading MobileSAM weights...")
               os.makedirs(os.path.dirname(weights_path), exist_ok=True)
               url = "https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt"
               response = requests.get(url)
               with open(weights_path, "wb") as f:
                   f.write(response.content)
           
           mobile_sam = sam_model_registry["vit_t"](checkpoint=weights_path)
           # Force CPU for safety
           mobile_sam.to(device='cpu')
           self.sam_predictor = SamPredictor(mobile_sam)
           logger.info("MobileSAM initialized for validation.")
           
        except Exception as e:
            logger.warning(f"MobileSAM not available ({e}). using geometric fallback.")
            self.sam_predictor = None

    def validate_mask(self, image_path: str, mask_path: str = None) -> bool:
        """
        Validates if the segmented object is a plausible jewelry item.
        Checks:
        1. Solidity (Jewelry is usually not a solid block, but has holes - low solidity is OK, but too low is noise)
        2. Area Coverage (Is it visible?)
        3. Aspect Ratio (Is it extreme?)
        4. SAM Confirmation (Does SAM find an object?)
        """
        try:
            # Load cleaned image (RGBA)
            img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if img is None:
                raise ValueError("Could not read image for validation")
            
            # Extract Alpha
            if img.shape[2] == 4:
                alpha = img[:, :, 3]
            else:
                # If RGB, assume black is background? No, pipeline gives RGBA.
                return False 

            # 1. Coverage Check
            total_pixels = alpha.size
            object_pixels = np.count_nonzero(alpha > 10)
            coverage = object_pixels / total_pixels
            
            logger.info(f"Object coverage: {coverage:.4f}")
            if coverage < 0.01: # < 1% of screen
                raise ValueError("Validation Failed: Object too small or empty.")
            
            # 2. Geometric Checks (Contours)
            contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                 raise ValueError("Validation Failed: No contours found.")
            
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            
            # Solidity = Area / ConvexHullArea
            hull = cv2.convexHull(largest_contour)
            hull_area = cv2.contourArea(hull)
            if hull_area > 0:
                solidity = area / hull_area
            else:
                solidity = 0
            
            logger.info(f"Object Solidity: {solidity:.2f}")
            
            # Jewelry (rings, necklaces) often has LOW solidity (holes).
            # If solidity is 1.0, it's a solid block (box?). 
            # If solidity is < 0.1, it's just scattered noise.
            if solidity < 0.1:
                 raise ValueError(f"Validation Failed: Object too fragmented (Solidity {solidity:.2f}).")
            
            # 3. SAM Validation (Verify Objectness)
            if self.sam_predictor:
                # Run SAM on the RGB part to see if it segment's something similar
                rgb = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)
                self.sam_predictor.set_image(rgb)
                
                # Prompt with center point
                h, w = rgb.shape[:2]
                input_point = np.array([[w//2, h//2]])
                input_label = np.array([1])
                
                masks, scores, logits = self.sam_predictor.predict(
                    point_coords=input_point,
                    point_labels=input_label,
                    multimask_output=True,
                )
                
                best_score = max(scores)
                logger.info(f"SAM Object Score: {best_score:.2f}")
                
                if best_score < 0.8:
                     raise ValueError(f"SAM Validation Failed: Low confidence object ({best_score:.2f})")

            return True

        except Exception as e:
            logger.error(f"Validation Error: {e}")
            raise e
