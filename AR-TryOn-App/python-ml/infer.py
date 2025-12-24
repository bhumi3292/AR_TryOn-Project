"""
Inference script used by ML service
"""

import torch

MODEL_PATH = "weights/depth_model.pt"

class DepthModel:
    def __init__(self):
        self.model = torch.load(MODEL_PATH)

    def predict_depth(self, image):
        # Placeholder depth map
        return [[0.5 for _ in range(256)] for _ in range(256)]
