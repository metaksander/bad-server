import { NextFunction, Request, RequestHandler, Response } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join, extname } from 'path'
import BadRequestError from '../errors/bad-request-error'
import sharp from 'sharp'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        )
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`
        cb(null, uniqueName)
    },
})

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = [
        'image/png',
        'image/jpg',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
    ]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new BadRequestError(
                'Invalid file type. Only JPEG, JPG, PNG, GIF, and SVG+XML are allowed.'
            )
        )
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
})

const MIN_SIZE = 2 * 1024 // 2 KB

const checkMinFileSize: RequestHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const { file } = req

    if (!file) {
        return next(new BadRequestError('File not provided'))
    }

    if (file.size < MIN_SIZE) {
        return next(new BadRequestError('File size must be at least 2 KB'))
    }

    next()
}

const checkImageMetadata: RequestHandler = async (req, _res, next) => {
    const { file } = req

    if (!file) {
        return next(new BadRequestError('File not provided'))
    }

    try {
        const metadata = await sharp(file.path).metadata()

        if (!metadata.width || !metadata.height) {
            return next(new BadRequestError('Invalid image metadata'))
        }

        next()
    } catch {
        next(new BadRequestError('Invalid image file'))
    }
}

const uploadImage: RequestHandler = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) return next(err)
        checkMinFileSize(req, res, async (err) => {
            if (err) return next(err)

            await checkImageMetadata(req, res, next)
        })
    })
}

export default uploadImage
