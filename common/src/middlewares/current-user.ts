import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'

// specify the content type of payload
interface UserPayload{
    id: string;
    email: string;
}

// ts can not add attribute to req directly
declare global {
    namespace Express {
      interface Request {
        currentUser?: UserPayload;
    }
  }
}

export const currentUser = (req : Request, res : Response, next : NextFunction) => {
    if(!req.session?.jwt){
        return next() // judge the user is login in the require-auth middleware
    }
    
    try{
        const payload = jwt.verify(req.session.jwt, process.env.JWT_KEY!) as UserPayload
        req.currentUser = payload
    }catch(err){}

    next()
}