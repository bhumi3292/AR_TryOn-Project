def estimate_depth(image_path):
    # Pure-Python dummy depth: small grid of zeros (no numpy dependency)
    h, w = 16, 16
    depth_map = [[0.0 for _ in range(w)] for _ in range(h)]
    return depth_map
