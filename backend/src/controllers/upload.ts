import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { fileTypeFromBuffer } from 'file-type'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    
    if (req.file.size < 2048) {
        return next(
            new BadRequestError(
                `Размер файла слишком маленький. Минимальный размер: 2 КB`
            )
        )
    }
    
    if (req.file.size > 10*1024*1024) {
        return next(
            new BadRequestError(
                `Размер файла слишком большой. Максимальный размер: 10 MB`
            )
        )
    }
    
    const type = await fileTypeFromBuffer(req.file.buffer)
    
    if (
        !type ||
        !['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'].includes(
            type.mime
        )
    ) {
        return next(
            new BadRequestError(
                'Недопустимый формат файла'
            )
        )
    }
  
    
    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
