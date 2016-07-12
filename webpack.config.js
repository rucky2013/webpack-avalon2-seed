var path = require('path');
var glob = require('glob');
var util = require('util');


var webpack= require('webpack');
var pkg=require("./package.json");

var ExtractTextPlugin = require('extract-text-webpack-plugin'); //提取文本
var HtmlWebpackPlugin = require('html-webpack-plugin'); //生成 html 模板 

//引入路径
var node_modules = path.resolve(__dirname, 'node_modules');


//获取路径
var jsBundle = path.join('_js', util.format('[name].%s.js', pkg.version));
var cssBundle = path.join('_css', util.format('[name].%s.css', pkg.version));


// 获取js
var entries = getEntry('app/_js/**/*.js', 'app/_js/');
console.log(entries)

//获取 html 多模块入口文件
var pages = Object.keys(entries);

console.log(pages);

config = {
    devServer: {
        inline: true,
        port: 7777
    },
    // devtool : "source-map", //调试
    // entry: ['webpack/hot/only-dev-server', './app/main.jsx'],
    entry: Object.assign(entries, {
        // 用到什么公共lib（例如jquery.js），就把它加进vendor去，目的是将公用库单独提取打包
        'common': ['jquery','avalon2']
    }),
    resolve: {
        alias: {
            'jquery': path.resolve(__dirname, 'app/_lib/jQuery-3.0.0.js'),
            'avalon2':path.resolve(node_modules,'avalon2/dist/avalon.js')
        }
    },
    output: {
        path: path.join(__dirname, './dist'),
        publicPath:'/webpack-avalon2-seed/dist/',
        filename: jsBundle
    },
    module: {
        loaders: [
            // { test: /\.js?$/,
            //     exclude: /node_modules/, //排除文件夹
            //     loader: 'babel',
            //     query:{
            //         presets:['es2015']
            //     }
            // },
            {
                test:/\.scss$/,
                // loaders: ['style', 'css', 'sass']
                loader: ExtractTextPlugin.extract("css!sass")
                // loaders: ExtractTextPlugin.extract("css","sass")
            },
            {
                test: /\.(woff|woff2|ttf|eot|svg)(\?t=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?name=_fonts/[name].[ext]'
            }, {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'url-loader?limit=8192&name=_images/[name]-[hash].[ext]'
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin(cssBundle, {
            allChunks: true
        }),
        new webpack.ProvidePlugin({ //加载jq
            $: 'jquery',
            avalon:'avalon2'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common', // 将公共模块提取，生成名为`vendors`的chunk
            chunks: pages, //提取哪些模块共有的部分
            minChunks: pages.length
        })
    ]
};

//html 模板插件
pages.forEach(function(pathname) {

    var conf = {
        filename: './_views/' + pathname + '.html', //生成的html存放路径，相对于path
        template: path.resolve(__dirname, './app/_views/' + pathname + '.html'), //html模板路径
        hash: true,
        //inject: false, //js插入的位置，true/'head'/'body'/false
        /*
         * 压缩这块，调用了html-minify，会导致压缩时候的很多html语法检查问题，
         * 如在html标签属性上使用{{...}}表达式，很多情况下并不需要在此配置压缩项，
         * 另外，UglifyJsPlugin会在压缩代码的时候连同html一起压缩。
         * 为避免压缩html，需要在html-loader上配置'html?-minimize'，见loaders中html-loader的配置。
         */
        // minify: { //压缩HTML文件
        // 	removeComments: true, //移除HTML中的注释
        // 	collapseWhitespace: false //删除空白符与换行符
        // }
    };
    if (pathname in config.entry) {
        conf.inject = 'body';
        conf.chunks = ['common', pathname];
    }
    config.plugins.push(new HtmlWebpackPlugin(conf));
});

module.exports = config;

/**
 * 获得路径
 * @param globPath: str
 * @param pathDir: path
 * @returns {{}}
 */
function getEntry(globPath, pathDir) {
    var files = glob.sync(globPath);
    var entries = {},
        entry, dirname, basename, pathname, extname;

    for (var i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.normalize(path.join(dirname,  basename));
        pathDir = path.normalize(pathDir);
        if(pathname.startsWith(pathDir)){
            pathname = pathname.substring(pathDir.length)
        }
        entries[pathname] = ['./' + entry];
    }
    return entries;
}


