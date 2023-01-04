config:
- configure PostgreSQL database and sequalize
- configure auth key

routes:
-auth routes
-user routes

middlewares:
-verify, check for duplicacy of username or email
-verify token, check user roles in database

controllers:
-auth controller: control actions
-user controller: 

models:
-user model
-role model
