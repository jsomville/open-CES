const logger = (req, res, next) => {

  res.on('finish', () => {

    const responseTime = res.getHeader('X-Response-Time');

    if (!process.env.IS_TESTING) {
      if (process.env.ENVIRO == 'PRD') {
        console.log(`${req.method} ${req.protocol}://${req.get('host')} ${req.originalUrl} ${res.statusCode} ${responseTime}`);
      }
      else {
        console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        console.log(`  url           : ${req.originalUrl}`);
        console.log(`  status code   : ${res.statusCode}`);
        console.log(`  response rime : ${responseTime}`);
      }
    }
  })

  next();
}

export default logger;