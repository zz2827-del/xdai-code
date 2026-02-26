from PIL import Image
import sys

def make_transparent(file_path):
    try:
        img = Image.open(file_path).convert("RGBA")
        datas = img.getdata()
        
        # Get background color from the top left pixel (0,0)
        bg_color = img.getpixel((0, 0))
        
        newData = []
        for item in datas:
            # Check if pixel matches background color within a small tolerance
            if abs(item[0] - bg_color[0]) < 5 and \
               abs(item[1] - bg_color[1]) < 5 and \
               abs(item[2] - bg_color[2]) < 5:
                newData.append((255, 255, 255, 0)) # Make transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(file_path, "PNG")
        print(f"Processed {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

make_transparent("gorilla.png")
make_transparent("runner.png")
