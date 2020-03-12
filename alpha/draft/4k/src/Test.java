import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.jpeg.JPEGImageWriteParam;
import javax.imageio.stream.ImageOutputStream;


public class Test{
  protected static int getColor(final int rgb, final int shift) {
    final int c = (rgb >>> shift) & 0xff;
    return Math.min(255, c * 3) << shift;
  }
  public static void main(String[] args) throws Exception {
    final BufferedImage src = ImageIO.read(new File("1908f1_1920_1080.jpg") );
    final int width = src.getWidth() * 2;
    final int height = src.getHeight() * 2;
    
    BufferedImage dst = new BufferedImage(
        width, height, BufferedImage.TYPE_INT_RGB);
    for (int y = 0; y < height; y += 1) {
      for (int x = 0; x < width; x += 1) {
        final int rgb = src.getRGB(x / 2, y / 2);
        final int x4 = x % 3;
        if (x4 == 0) {
          dst.setRGB(x, y, getColor(rgb, 16) );
        } else if (x4 == 1) {
          dst.setRGB(x, y, getColor(rgb, 8) );
        } else if (x4 == 2) {
          dst.setRGB(x, y, getColor(rgb, 0) );
        }
      }
    }

    ImageWriteParam param = new JPEGImageWriteParam(null);
    param.setProgressiveMode(JPEGImageWriteParam.MODE_DISABLED);
    param.setCompressionMode(JPEGImageWriteParam.MODE_EXPLICIT);
    param.setCompressionQuality(1);
    OutputStream out = new FileOutputStream("1908f1_1920_1080_4k.jpg");
    ImageOutputStream imageOut = ImageIO.createImageOutputStream(out);

    ImageWriter writer = (ImageWriter)ImageIO.getImageWritersByFormatName("jpg").next();
    try {
      writer.setOutput(imageOut);

      writer.write(null, new IIOImage(dst, null, null), param);
    } finally {
      writer.dispose();
    }
    System.out.println("done");
  }
}