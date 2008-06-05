python scripts/build.py
echo "Minifying javascript..."
cat deploy/ptd.js | python scripts/jsmin.py > deploy/ptd.min.js
mv deploy/ptd.min.js deploy/ptd.js
echo "Javascript minified."
echo "Done.  See the deploy/ directory"