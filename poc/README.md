# Instructions

## Node.js

1.Install node

    curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
    sudo apt-get install -y nodejs

2.Install libs

    npm install iota.lib.js

## Web

1.Copy maia.html to your webserver folder

    mkdir <webserver>/maia
    cp web/maia.html <webserver>/maia/

2.Copy libs to your webserver folder

    mkdir <webserver>/maia/lib
    cp ../lib/iota-bindings-emscripten.wasm <webserver>/maia/lib/
    cp ../lib/mam.web.js <webserver>/maia/lib/
    cp ../lib/iota.min.js <webserver>/maia/lib/
    cp ../dist/maia.js <webserver>/maia/lib/

3.Modify maia.html

    ...
	<script type="text/javascript" src="../../lib/iota.min.js"></script>  <!-- ./lib/iota.min.js -->
	<script type="text/javascript" src="../../lib/mam.web.js"></script>   <!-- ./lib/mam.web.js  -->
	<script type="text/javascript" src="../../dist/maia.js"></script>     <!-- ./lib/maia.js     -->
    ...

4.Modify mam.web.js

    // Line 22556
    })({"wasmBinaryFile":"/maia/lib/iota-bindings-emscripten.wasm","ENVIRONMENT":"WEB"}) // 'YOUR PATH'