Place the following three files here:

  aora-hero.mp4      H.264 / MP4    target size < 4 MB
  aora-hero.webm     VP9 / WebM     target size < 3 MB
  aora-poster.jpg    single frame   target size < 80 KB

From the project root, run (requires ffmpeg):

  ffmpeg -i Upscale.mp4 \
    -vcodec libx264 -crf 28 -preset slow -an \
    -movflags +faststart -vf "scale=1920:-2" \
    public/video/aora-hero.mp4

  ffmpeg -i Upscale.mp4 \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -an \
    -vf "scale=1920:-2" \
    public/video/aora-hero.webm

  ffmpeg -i Upscale.mp4 -vframes 1 -q:v 2 \
    public/video/aora-poster.jpg

If ffmpeg is unavailable:  brew install ffmpeg
