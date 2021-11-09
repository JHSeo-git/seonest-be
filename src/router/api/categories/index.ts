import Router from '@koa/router';
import * as categoryCtrl from './categories.torm.ctrl';

const categories = new Router();

categories.get('/', categoryCtrl.getCategories);
categories.get('/:slug', categoryCtrl.getCategory);

export default categories;
