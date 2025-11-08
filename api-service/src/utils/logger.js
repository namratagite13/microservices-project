const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "NODE_ENV" ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack:true}),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: {service: 'api-service'},
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: "combine.log"})
    ]
});

module.exports = logger;