const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const isDev = true;

const compiler =webpack({
	mode: isDev?'development':'production',
	entry: ['./src/index.js',...(isDev ? ['webpack-hot-middleware/client?reload=true&overlay=true']:[])],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [{
					loader: require.resolve('babel-loader'),
					options: {
						plugins: [isDev && require.resolve('react-refresh/babel')].filter(Boolean),
						presets: [
							["@babel/preset-react", {"runtime": "automatic"}]
						]
					},
				}],
			}, 
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			}
		],
	},   
	plugins: [
		new HtmlWebpackPlugin({
			templateContent: "<html><head><link rel=\"icon\" href=\"data:;base64,iVBORw0KGgo=\"></head><body></body></html>"
		}),
		...(isDev ? [
			new ReactRefreshWebpackPlugin(),
			new webpack.HotModuleReplacementPlugin(),
			new ESLintPlugin()
		]:[])
	],  
	resolve: {
		extensions: ['*', '.js'],
	},
	performance: {
		maxEntrypointSize: 1224000,
		maxAssetSize: 1224000
	},
	devtool: isDev ? 'source-map':false,
	optimization: {
		moduleIds: 'deterministic',
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				}
			}
		}
	},
	output: {
		filename: '[name].[contenthash].js',
	}
});	

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const appSocket = require('./app.js')(server);
const compression = require('compression');

if(isDev){

	app.use(require("webpack-dev-middleware")(compiler));
	app.use(require("webpack-hot-middleware")(compiler));

}else{
	
	compiler.run((err, stats) => {
		if (err || stats.hasErrors()) {
			console.log(err);
		}
		console.log(stats.toString({colors: true}));
		compiler.close((closeErr) => {
			console.log('compiler close');
		});
	});
	app.use(express.static('dist'));
	app.use(compression());
}


server.listen(80, () => {});
