"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[8159],{"./packages/components/src/utils/rtl.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{h:()=>rtl});var _emotion_react__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/@emotion/react/dist/emotion-react.browser.esm.js"),_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./packages/i18n/build-module/index.js");const LOWER_LEFT_REGEXP=new RegExp(/-left/g),LOWER_RIGHT_REGEXP=new RegExp(/-right/g),UPPER_LEFT_REGEXP=new RegExp(/Left/g),UPPER_RIGHT_REGEXP=new RegExp(/Right/g);function getConvertedKey(key){return"left"===key?"right":"right"===key?"left":LOWER_LEFT_REGEXP.test(key)?key.replace(LOWER_LEFT_REGEXP,"-right"):LOWER_RIGHT_REGEXP.test(key)?key.replace(LOWER_RIGHT_REGEXP,"-left"):UPPER_LEFT_REGEXP.test(key)?key.replace(UPPER_LEFT_REGEXP,"Right"):UPPER_RIGHT_REGEXP.test(key)?key.replace(UPPER_RIGHT_REGEXP,"Left"):key}const convertLTRToRTL=(ltrStyles={})=>Object.fromEntries(Object.entries(ltrStyles).map((([key,value])=>[getConvertedKey(key),value])));function rtl(ltrStyles={},rtlStyles){return()=>rtlStyles?(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.V8)()?(0,_emotion_react__WEBPACK_IMPORTED_MODULE_1__.AH)(rtlStyles,"",""):(0,_emotion_react__WEBPACK_IMPORTED_MODULE_1__.AH)(ltrStyles,"",""):(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.V8)()?(0,_emotion_react__WEBPACK_IMPORTED_MODULE_1__.AH)(convertLTRToRTL(ltrStyles),"",""):(0,_emotion_react__WEBPACK_IMPORTED_MODULE_1__.AH)(ltrStyles,"","")}rtl.watch=()=>(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.V8)()}}]);