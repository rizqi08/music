const multer = require ('multer');

module.exports = (imageFile) => {
    
    const storage = multer.diskStorage({
        destination: function(req,file,cb){
            cb(null, 'uploads');
        },
        filename: function(req,file,cb) {
            cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,''));
        }
    });

    const fileFilter = function(req,file,cb) {
        if(file.filename === imageFile) {
            if(!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)){
                req.fileValidationError = {
                    message: 'Only image files are allowed!'
                }
                return cb(new Error('Only image files are allowed!'),false);
            }
        }
        cb(null,true);
    };

    const sizeMb = 10;
    const maxSize = sizeMb * 1000 * 1000;

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize,
        },
    }).single(imageFile);
    
    // .fields([
    //     {
    //         name: 'music'
    //     },
    //     {
    //         name: 'image'
    //     }
    // ]);



    return function (req,res,next) {
        upload(req,res, function (err){
            if(req.fileValidationError){
                req.session.message = {
                    type: 'danger',
                    message: 'Please select file to upload',
                };
                return res.redirect(req.originalUrl);
            }

        if(err){
            if(err.code == 'LIMIT_FILE_SIZE'){
                req.session.message = {
                    type: 'danger',
                    message: 'Error, Max file size 10MB',
                };
                return res.redirect(req.originalUrl);
            }

            req.session.message = {
                type: 'danger',
                message: err,
            };
            return res.redirect(req.originalUrl);
            }

            return next();
    });
    };
}