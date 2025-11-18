import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

let i = 0;
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    i++;
    res.on('finish', () => {
      if (
        req.headers['user-agent'] &&
        req.headers['user-agent'].includes('restler')
      ) {
        console.log(
          `${i} - ${req.headers['user-agent']} - Called ${req.originalUrl} - ${res.statusCode}`,
        );
        console.log(req.headers);
      }
    });
    next();
  }
}
