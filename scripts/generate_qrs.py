import qrcode
import os

# URLs - Updated for Vercel
urls = {
    "bioskin-tech": "https://saludbioskin.vercel.app/#/bioskin-tech",
    "services": "https://saludbioskin.vercel.app/#/services"
}

# Output directory
output_dir = "public/images/qr"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Data for generation
for name, url in urls.items():
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    file_path = os.path.join(output_dir, f"{name}.png")
    img.save(file_path)
    print(f"Generated QR for {name} ({url}) at {file_path}")
