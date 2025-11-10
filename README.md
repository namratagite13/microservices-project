# Notes Microservice Project  
The project is a microservice based project for managing user service and notes service.  
it used centralized API gatway service for managing user and notes routes.

## Key Features
1.Microservices Architecture for handling multiple services flexibly.    
2.Api Service act as entry point for routes and handling functions across other services.  
3.Containerized Deployment using docker.    
4.Middleware function like authMiddleware for handling JWT accesstoken for passing and accepting bearer token.    
5.Middleware function like authRateLimiter for managing requests rate limit.   
6.Utility function like logger for logging function using winston.  
7.ErrorHandler middleware for centralized error handling.    

## Middleware services used
```authMiddleware``` Jwt authentication of routes.  
```errorHandler``` Centralized error handling.   
```logger``` Logging service using winston.    
```authRateLimiter``` Rate Limiting for managing requests.  

## User Service
User Authentication using JWT tokens.   
Secure password storage using bcryptjs.    
Forgot/Reset password system using Mailtrap api.    

## Note Service  
Notes controllers such as create, Update, Delete, and Seach by id of user.    
Strict user only access to notes using Authorization token and user id.    

## Prerequisites
### Should be installed:  
Docker  
Docker compose  
Node.js  
Mongodb Atlas  

### Environmental Variables 
For api-service  
```port```:3000  
```NODE_ENV```:development       
```ACCESS_TOKEN_SECRET```: **`YOUR_RANDOM_SECRET_KEY`**  
```REDIS_URL```:redis://redis:6379  
```USER_SERVICE_URL```:http://user-service:3001  
```NOTES_SERVICE_URL```:http://notes-service:3002

For user-service  
```port```:3001  
```NODE_ENV```:development  
```MONGODB_URI```: Your connection string for MongoDB Atlas.      
```ACCESS_TOKEN_SECRET```: **`YOUR_RANDOM_SECRET_KEY`**  
```REDIS_URL```:redis://redis:6379  


For notes-service  
```port```:3002    
```NODE_ENV```:development  
```MONGODB_URI```: Your connection string for MongoDB Atlas.      
```ACCESS_TOKEN_SECRET```: **`YOUR_RANDOM_SECRET_KEY`**  
```REDIS_URL```:redis://redis:6379  


### created basic mailtrap sendbox configuration using mailtrap service  
MAIL_MAILER=****  
MAIL_HOST=****  
MAIL_PORT=***  
MAIL_USERNAME=***  
MAIL_PASSWORD=***  
MAIL_ENCRYPTION=***  

#Sender Information  
FROM_EMAIL=YOUR'S MAIL  
FROM_NAME=****  


### docker compose file  
for building and starting and starting entire system docker commands used:  
```
docker compose build
docker compose up
```
for viewing longs:  
```
docker compose logs -f
```
for checking service status: 
```
docker compose ps 
```


## service name and port used  
api-service: 3000  
user-service: 3001  
notes-servive: 3002  
redis: 6379    

main Api can be accessed at ```http://localhost:3000```

## User Service Endpoints
user service can be accesssed at ```http://localhost:3000/v1/auth/```  
POST - ```/v1/auth/register```           :user registration   
POST - ```/v1/auth/login```              :user login   
GET - ```/v1/auth/getProfile```          :user profile  
POST - ```/v1/auth/forgotPassword```     :fogot password mail  
POST - ```/v1/auth/resetPassword/:resettoken```  :password reset    


## Notes Service Endpoints
user service can be accesssed at ```http://localhost:3000/v1/notes/```  
POST - ```/v1/notes/create-note```     :create note    
GET - ```/v1/notes/get-note```         :get note    
GET - ```/v1/notes/:id```              :get not by id    
POST - ```/v1/notes/:id```             :update note    
DELETE - ```/v1/notes/:id```           :delete note      



















