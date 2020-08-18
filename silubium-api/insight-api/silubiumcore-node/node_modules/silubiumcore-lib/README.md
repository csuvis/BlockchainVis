Silubiumcore Library
=======

A pure and powerful JavaScript SILUBIUM library.


## Get Started

```
npm install silubiumcore-lib
```

```
bower install silubiumcore-lib
```

## Security

We're using silubiumcore-lib in production, but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.



## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. 

## Building the Browser Bundle

To build a silubiumcore-lib full bundle for the browser:

```sh
gulp browser
```

This will generate files named `silubiumcore-lib.js` and `silubiumcore-lib.min.js`.

## Development & Tests

```sh
git clone http://172.16.0.99/szc/silubiumcore-lib
cd silubiumcore-lib
npm install
```

Run all the tests:

```sh
gulp test
```

You can also run just the Node.js tests with `gulp test:node`, just the browser tests with `gulp test:browser`
or create a test coverage report (you can open `coverage/lcov-report/index.html` to visualize it) with `gulp coverage`.

## License

