"""
Train depth estimation / segmentation model
(Currently placeholder – extend later with MiDaS / MediaPipe)
"""

import os
import torch

def train():
    print("🔧 Training model...")
    os.makedirs("weights", exist_ok=True)

    dummy_weights = torch.randn(1)
    torch.save(dummy_weights, "weights/depth_model.pt")

    print("✅ Training completed. Weights saved.")

if __name__ == "__main__":
    train()
