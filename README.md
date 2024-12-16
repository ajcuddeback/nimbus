# nimbus
A weather statistics application

# Rationale
- Choice of Database
  - I will be using MongoDB for the primary DB of writing real time weather data from multiple weather stations. MongoDB offers:
    -  Fast writes
    -  Quick reads
    -  Built in data aggregation
    -  Data anlysis functions such as averaging
    -  Horizontal partitioning
    -  Provides a flexible schema, allowing me to hit the ground running and know I can change the schema when I need to
 - Why I didn't pick PSQL
    - While my weather data is structured and can easily be pre-defined, I'd prefer not to get locked into a schema with likely future changes to the schema
    - I don't really <i>need</i> to worry about some code overwriting existing data. Once the weather data has been writen, it should not be updated ever again. While PSQL would benefit me if I had many users updating the same data, I don't exactly have this need so PSQL wouldn't add that benefit
    - I need very quick writes and reads to allow users to get accurate real time updates to weather. And to allow many weather stations, as my applications continues to grow, to be able to quickly write real time updates to weather. MongoDB is just better at handling this than PSQL as it will scale better and natrually has faster writes.
