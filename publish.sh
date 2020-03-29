dirname=`cat package.json | jq -r '.name'`-`cat package.json | jq -r '.version'`
tarball=$dirname.tar.gz
mkdir -p $dirname

npm run build
cp -r dist/src/* package.json README.md $dirname
tar cfvz $tarball $dirname
rm -rf $dirname

npm publish ./$tarball

rm $tarball