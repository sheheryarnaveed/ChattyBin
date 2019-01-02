import {MDCRipple} from '@material/ripple';
import { MDCTextField } from '@material/textfield';

import { MDCList } from '@material/list';
new MDCList(document.querySelector('.mdc-list'));

const username = new MDCTextField(document.querySelector('.username'));
const password = new MDCTextField(document.querySelector('.password'));

new MDCRipple(document.querySelector('.cancel'));
new MDCRipple(document.querySelector('.next'));