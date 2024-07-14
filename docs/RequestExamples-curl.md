# This file shows http requests using "curl"

### Test that our Schema exists

First, let's check that our schema.graphql file was picked up by the HarperDB application.

This operation will describe the current schemas. We have only one: Dog. With zero records.

```
curl -X POST http://localhost:9925/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk" \
     -d '{
           "operation": "describe_all"
         }'
```

### Create a dog record.

```
curl -X POST \
  http://localhost:9926/Dog \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk" \
  -d '{
    "name": "Harper",
    "breed": "Labrador",
    "age": 3,
    "tricks": ["sits"]
}'
```

### Create a 2nd dog record.

```
curl -X POST \
  http://localhost:9926/Dog \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk" \
  -d '{
    "name": "Benji",
    "breed": "Border collie",
    "age": 5,
    "tricks": ["sits", "shakes"]
}'
```

### Check that Two dogs exist in our Dog table.

That operation is defined by our getAll route in routes/index.js:

```
curl -X GET \
  http://localhost:9926/application-template/getAll \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk"
```

### Check out an example of the Operations API.

The [Operations API](https://docs.harperdb.io/docs/developers/operations-api) allows us to, for example, create a new table via REST API. (As we tested out at the top of this file, also it allows us to describe all of our schemas, and offers a myriad of other uses: https://docs.harperdb.io/docs/developers/operations-api)

```
curl -X POST \
 http://localhost:9925/ \
 -H "Content-Type: application/json" \
 -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk" \
 -d '{
"operation": "create_table",
"table": "exampleTable",
"primary_key": "id"
}'
```

### Let's check out a second route.

curl -X GET "http://localhost:9926/application-template/getAnotherRoute" \
 -H "Content-Type: application/json" \
 -H "Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk"
