using System;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

namespace ClipImage {

    /// <summary>
    /// ClipImage �̊T�v�̐����ł��B
    /// </summary>
    class ClipImage {

        const int EXIT_SUCCESS = 0;
        const int EXIT_FAILURE = 1;

        /// <summary>
        /// �A�v���P�[�V�����̃��C�� �G���g�� �|�C���g�ł��B
        /// </summary>
        [STAThread]
        static int Main(string[] args) {

            string filename = (args.Length > 0)? args[0] : DateTime.Now.ToString("yyyyMMddHHmmss") + ".jpg";
            string fileFormat = (args.Length > 1)? args[1] : "jpeg";

            // �N���b�v�{�[�h����f�[�^���擾�B
            IDataObject data = Clipboard.GetDataObject();

            if (data == null) {
                // �f�[�^�� null
                return EXIT_FAILURE;
            }

            string[] formats = data.GetFormats();

            foreach (string format in formats) {
                
                Bitmap bitmap = null;

                if (format.Equals("System.Drawing.Bitmap") ) {
                    // Bitmap�̏ꍇ
                    bitmap = (Bitmap)data.GetData(typeof(System.Drawing.Bitmap) );
                } else if (format.Equals("JFIF") || format.Equals("PNG") ) {
                    // JFIF�܂���PNG�̏ꍇ�A�������X�g���[������ǂݎ��
                    bitmap = new Bitmap( (Stream)data.GetData(format) );
                }

                if (bitmap != null) {

                    if (fileFormat.Equals("jpeg") ) {

                        // JPEG�`���ŕۑ�

                        ImageCodecInfo codec = null;
                        foreach (ImageCodecInfo imageEncoder in ImageCodecInfo.GetImageEncoders() ) {
                            if (imageEncoder.MimeType.Equals("image/jpeg") ) {
                                codec = imageEncoder;
                            }
                        }

                        EncoderParameters encoderParams = new EncoderParameters(1);
                        encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, 100L);
                        
                        bitmap.Save(filename, codec, encoderParams);

                        return EXIT_SUCCESS;
                    } else if (fileFormat.Equals("png") ) {

                        // PNG�`���ŕۑ�

                        bitmap.Save(filename, ImageFormat.Png);

                        return EXIT_SUCCESS;

                    }

                }
            }


            return EXIT_FAILURE;
        }




    }


}
