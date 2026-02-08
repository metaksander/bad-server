import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import uploadImage from '../middlewares/file'

const uploadRouter = Router()
uploadRouter.post('/', uploadImage, uploadFile)

export default uploadRouter
