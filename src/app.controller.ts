import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/healthcheck')
  async linkToHealthcheck() {
    /*    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Version and Healthcheck</title>
        </head>
        <body>
          <h1>Version: ${process.env.VERSION || '0.0.0'}</h1>
          <a href="/healthcheck">Healthcheck</a>
        </body>
        </html>
      `; */
  }
}
