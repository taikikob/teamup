import { useState } from "react";
import { makeAspectCrop, ReactCrop, centerCrop, type Crop, type PixelCrop } from "react-image-crop";
import 'react-image-crop/dist/ReactCrop.css'
// import "../css/ImageCropper.css" // Make sure this file exists
import { useUser } from "../contexts/UserContext"; // Make sure this context exists
import '../css/ImageCropper.css';

const ASPECT_RATIO = 1; // Square crop
const MIN_DIMENSION = 150; // Minimum dimension for the crop area

interface ImageCropperProps {
    onClose: () => void;
}

function ImageCropper({ onClose }: ImageCropperProps) {
    const [imgSrc, setImgSrc] = useState<string>("");
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const [error, setError] = useState<string>("");
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    
    // Make sure this hook exists in your UserContext
    const { uploadProfilePicture } = useUser();

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        // Validate file size (optional - e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError('Image file is too large. Please choose a file smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setError(""); // Reset error message
            const imageElement = new Image();
            const imageUrl = reader.result?.toString() || "";
            
            imageElement.onload = () => {
                const { naturalWidth, naturalHeight } = imageElement;
                if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
                    setError(`Image must be at least ${MIN_DIMENSION}px by ${MIN_DIMENSION}px.`);
                    setImgSrc("");
                    return;
                }
                setImgSrc(imageUrl);
            };
            
            imageElement.onerror = () => {
                setError('Failed to load image. Please try a different file.');
            };
            
            imageElement.src = imageUrl;
        });
        
        reader.onerror = () => {
            setError('Failed to read file. Please try again.');
        };
        
        reader.readAsDataURL(file);      
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget as HTMLImageElement;
        setImageDimensions({ width: naturalWidth, height: naturalHeight });
        
        const cropWidthInPercent = 40; // Fixed 40% of image width
        const crop = makeAspectCrop(
            {
                unit: '%',
                width: cropWidthInPercent,
            },
            ASPECT_RATIO,
            naturalWidth,
            naturalHeight
        );
        const centeredCrop = centerCrop(crop, naturalWidth, naturalHeight);
        setCrop(centeredCrop);
    }

    async function getCroppedImg(imageSrc: string, crop: PixelCrop): Promise<Blob | null> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // Handle CORS if needed
            
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = crop.width;
                canvas.height = crop.height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    crop.width,
                    crop.height
                );
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/jpeg', 0.9); // Added quality parameter
            };
            
            image.onerror = () => {
                reject(new Error('Failed to load image for cropping'));
            };
            
            image.src = imageSrc;
        });
    }

    const handleCropAndUpload = async () => {
        if (!imgSrc || !crop || !imageDimensions) {
            setError('Please select and crop an image first.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const pixelCrop = percentCropToPixelCrop(crop, imageDimensions.width, imageDimensions.height);
            const croppedBlob = await getCroppedImg(imgSrc, pixelCrop);
            
            if (croppedBlob) {
                // Uncomment when ready to upload
                await uploadProfilePicture(croppedBlob);
                onClose();
            }
        } catch (error) {
            console.error('Error cropping image:', error);
            setError('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    function percentCropToPixelCrop(percentCrop: Crop, imageWidth: number, imageHeight: number): PixelCrop {
        return {
            x: Math.round((percentCrop.x ?? 0) * imageWidth / 100),
            y: Math.round((percentCrop.y ?? 0) * imageHeight / 100),
            width: Math.round((percentCrop.width ?? 0) * imageWidth / 100),
            height: Math.round((percentCrop.height ?? 0) * imageHeight / 100),
            unit: 'px'
        };
    }

    return (
        <div className="image-cropper">
            <div className="file-input-container">
                <label htmlFor="file-input" className="file-input-label">
                    Choose profile photo
                </label>
                <br></br>
                <input
                    id="file-input"
                    type="file" 
                    accept="image/*" 
                    onChange={onSelectFile}
                />
            </div>
            
            {error && <div className="error" role="alert">{error}</div>}
            
            {imgSrc && (
                <div className="image-preview">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        circularCrop
                        keepSelection
                        aspect={ASPECT_RATIO}
                        minWidth={MIN_DIMENSION}
                    >
                        <img 
                            src={imgSrc}
                            alt="Crop preview"
                            style={{ maxHeight: "70vh", maxWidth: "100%" }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>
            )}
            
            <div className="button-container">
                <button onClick={onClose} type="button">
                    Cancel
                </button>
                <button 
                    onClick={handleCropAndUpload}
                    disabled={!imgSrc || !crop || isProcessing}
                    type="button"
                >
                    {isProcessing ? 'Processing...' : 'Use as Profile Picture'}
                </button>
            </div>
        </div>
    );
}

export default ImageCropper;