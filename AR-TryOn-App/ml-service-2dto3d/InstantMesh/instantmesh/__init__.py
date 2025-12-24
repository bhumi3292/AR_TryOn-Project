import os

# Make this shim package point to the real package contents located in
# ../src so `import instantmesh.models` and similar imports work when
# the project root (InstantMesh) is on sys.path.
__path__.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'src')))
