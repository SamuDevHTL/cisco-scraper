from cairosvg import svg2png
import os

def convert_svg_to_png(svg_path, png_path, size):
    with open(svg_path, 'rb') as svg_file:
        svg2png(file_obj=svg_file, write_to=png_path, output_width=size, output_height=size)

# Create PNG files of different sizes
sizes = [16, 48, 128]
for size in sizes:
    png_path = f'icons/icon{size}.png'
    convert_svg_to_png('icons/icon.svg', png_path, size)
    print(f'Created {png_path}') 