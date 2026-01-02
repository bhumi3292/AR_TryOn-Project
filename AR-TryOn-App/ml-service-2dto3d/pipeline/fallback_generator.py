import os
import logging
import trimesh
import numpy as np
from .mesh_generator import MeshGenerator

logger = logging.getLogger("FallbackGenerator")

class FallbackGenerator:
    """
    Generates high-quality, determinstic geometric primitives to serve as 
    fallback 3D assets when the ML pipeline fails.
    
    This ensures the 'Try-On' button NEVER breaks, even if the result 
    is a generic placeholder.
    """
    
    @staticmethod
    def generate(category: str, output_path: str, reason: str = None) -> dict:
        logger.info(f"Engaging Fallback Mode for category: {category} (Reason: {reason})")
        
        category = category.lower()
        mesh = None

        try:
            # 1. Select Template based on simple keyword matching
            if "ring" in category:
                # Create a Torus (Ring shape)
                # major_radius = distance from center to tube center
                # minor_radius = tube radius
                mesh = trimesh.creation.torus(major_radius=0.01, minor_radius=0.002, sections=64)
                # Rotate to face Forward (Z) or Up (Y)? 
                # WebGL usually Y-up. Ring usually lies on logic.
                # Let's rotate it 90 deg around X to stand up
                # mesh.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2, [1,0,0]))
                
            elif "necklace" in category or "chain" in category:
                # Larger Torus
                mesh = trimesh.creation.torus(major_radius=0.08, minor_radius=0.001, sections=128)
                # Rotate to lie flat or hang?
                # Usually necklaces are displayed flat or on a bust.
                # Let's keep it default.
                
            elif "earring" in category:
                # Sphere + Cylinder (Drop earring)
                s = trimesh.creation.icosphere(radius=0.005)
                c = trimesh.creation.cylinder(radius=0.001, height=0.02)
                c.apply_translation([0, 0.015, 0])
                mesh = trimesh.util.concatenate([s, c])
                
            else:
                # Generic Gem / Sphere
                mesh = trimesh.creation.icosphere(radius=0.01, subdivisions=4)

            # 2. Add Dummy Color (Gold)
            # Trimesh visuals are basic, we rely on PBR injection later
            mesh.visual.vertex_colors = [255, 215, 0, 255] # Gold
            
            # 3. Export
            mesh.export(output_path)
            
            # 4. Inject PBR (Reuse logic if possible, or duplicate)
            # We inject "High Polish Gold" materials
            FallbackGenerator._inject_pbr(output_path)
            
            return {
                "is_fallback": True,
                "fallback_reason": reason,
                "vertices": len(mesh.vertices),
                "template_type": category
            }
            
        except Exception as e:
            logger.error(f"Fallback generation also failed: {e}")
            raise e

    @staticmethod
    def _inject_pbr(glb_path):
        """Injects highly polished gold PBR material into the GLB."""
        try:
            from pygltflib import GLTF2, Material, PbrMetallicRoughness
            gltf = GLTF2().load(glb_path)
            if not gltf.materials:
                 gltf.materials.append(Material())
            
            for mat in gltf.materials:
                if mat.pbrMetallicRoughness is None:
                    mat.pbrMetallicRoughness = PbrMetallicRoughness()
                
                # Polished Gold
                # Base Color: Gold (Hex #PTD700 roughly) -> [1.0, 0.84, 0.0, 1.0]
                mat.pbrMetallicRoughness.baseColorFactor = [1.0, 0.84, 0.0, 1.0]
                mat.pbrMetallicRoughness.metallicFactor = 1.0
                mat.pbrMetallicRoughness.roughnessFactor = 0.1
                
            gltf.save(glb_path)
        except Exception as e:
            logger.warning(f"Fallback PBR injection failed: {e}")
