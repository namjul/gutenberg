"use strict";(self.webpackChunkgutenberg=self.webpackChunkgutenberg||[]).push([[7499],{"./packages/components/src/item-group/context.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{C:()=>ItemGroupContext,j:()=>useItemGroupContext});var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/react/index.js");const ItemGroupContext=(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createContext)({size:"medium"}),useItemGroupContext=()=>(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useContext)(ItemGroupContext)},"./packages/components/src/item-group/item-group/component.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{t:()=>ItemGroup,A:()=>item_group_component});var context_connect=__webpack_require__("./packages/components/src/context/context-connect.ts"),use_context_system=__webpack_require__("./packages/components/src/context/use-context-system.js"),styles=__webpack_require__("./packages/components/src/item-group/styles.ts"),use_cx=__webpack_require__("./packages/components/src/utils/hooks/use-cx.ts");var context=__webpack_require__("./packages/components/src/item-group/context.ts"),component=__webpack_require__("./packages/components/src/view/component.tsx"),jsx_runtime=__webpack_require__("./node_modules/react/jsx-runtime.js");function UnconnectedItemGroup(props,forwardedRef){const{isBordered,isSeparated,size:sizeProp,...otherProps}=function useItemGroup(props){const{className,isBordered=!1,isRounded=!0,isSeparated=!1,role="list",...otherProps}=(0,use_context_system.A)(props,"ItemGroup");return{isBordered,className:(0,use_cx.l)()(isBordered&&styles.sW,isSeparated&&styles.Ci,isRounded&&styles.Wf,className),role,isSeparated,...otherProps}}(props),{size:contextSize}=(0,context.j)(),contextValue={spacedAround:!isBordered&&!isSeparated,size:sizeProp||contextSize};return(0,jsx_runtime.jsx)(context.C.Provider,{value:contextValue,children:(0,jsx_runtime.jsx)(component.A,{...otherProps,ref:forwardedRef})})}UnconnectedItemGroup.displayName="UnconnectedItemGroup";const ItemGroup=(0,context_connect.KZ)(UnconnectedItemGroup,"ItemGroup"),item_group_component=ItemGroup;try{ItemGroup.displayName="ItemGroup",ItemGroup.__docgenInfo={description:"`ItemGroup` displays a list of `Item`s grouped and styled together.\n\n```jsx\nimport {\n  __experimentalItemGroup as ItemGroup,\n  __experimentalItem as Item,\n} from '@wordpress/components';\n\nfunction Example() {\n  return (\n    <ItemGroup>\n      <Item>Code</Item>\n      <Item>is</Item>\n      <Item>Poetry</Item>\n    </ItemGroup>\n  );\n}\n```",displayName:"ItemGroup",props:{isBordered:{defaultValue:{value:"false"},description:"Renders a border around the itemgroup.",name:"isBordered",required:!1,type:{name:"boolean"}},isRounded:{defaultValue:{value:"true"},description:"Renders with rounded corners.",name:"isRounded",required:!1,type:{name:"boolean"}},isSeparated:{defaultValue:{value:"false"},description:"Renders a separator between each item.",name:"isSeparated",required:!1,type:{name:"boolean"}},size:{defaultValue:{value:"'medium'"},description:"Determines the amount of padding within the component.",name:"size",required:!1,type:{name:"enum",value:[{value:'"small"'},{value:'"large"'},{value:'"medium"'}]}},children:{defaultValue:null,description:"The children elements.",name:"children",required:!0,type:{name:"ReactNode"}},as:{defaultValue:null,description:"The HTML element or React component to render the component as.",name:"as",required:!1,type:{name:'"symbol" | "object" | "select" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | "base" | "bdi" | "bdo" | "big" | "blockquote" | "body" | "br" | "button" | ... 516 more ... | ("view" & FunctionComponent<...>)'}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["packages/components/src/item-group/item-group/component.tsx#ItemGroup"]={docgenInfo:ItemGroup.__docgenInfo,name:"ItemGroup",path:"packages/components/src/item-group/item-group/component.tsx#ItemGroup"})}catch(__react_docgen_typescript_loader_error){}},"./packages/components/src/item-group/item/component.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{q:()=>Item,A:()=>item_component});var react=__webpack_require__("./node_modules/react/index.js"),use_context_system=__webpack_require__("./packages/components/src/context/use-context-system.js"),styles=__webpack_require__("./packages/components/src/item-group/styles.ts"),context=__webpack_require__("./packages/components/src/item-group/context.ts"),use_cx=__webpack_require__("./packages/components/src/utils/hooks/use-cx.ts");var context_connect=__webpack_require__("./packages/components/src/context/context-connect.ts"),component=__webpack_require__("./packages/components/src/view/component.tsx"),jsx_runtime=__webpack_require__("./node_modules/react/jsx-runtime.js");function UnconnectedItem(props,forwardedRef){const{role,wrapperClassName,...otherProps}=function useItem(props){const{as:asProp,className,onClick,role="listitem",size:sizeProp,...otherProps}=(0,use_context_system.A)(props,"Item"),{spacedAround,size:contextSize}=(0,context.j)(),size=sizeProp||contextSize,as=asProp||(void 0!==onClick?"button":"div"),cx=(0,use_cx.l)(),classes=(0,react.useMemo)((()=>cx(("button"===as||"a"===as)&&styles.DB(as),styles.AV[size]||styles.AV.medium,styles.AS,spacedAround&&styles.GN,className)),[as,className,cx,size,spacedAround]),wrapperClassName=cx(styles.D5);return{as,className:classes,onClick,wrapperClassName,role,...otherProps}}(props);return(0,jsx_runtime.jsx)("div",{role,className:wrapperClassName,children:(0,jsx_runtime.jsx)(component.A,{...otherProps,ref:forwardedRef})})}UnconnectedItem.displayName="UnconnectedItem";const Item=(0,context_connect.KZ)(UnconnectedItem,"Item"),item_component=Item;try{Item.displayName="Item",Item.__docgenInfo={description:"`Item` is used in combination with `ItemGroup` to display a list of items\ngrouped and styled together.\n\n```jsx\nimport {\n  __experimentalItemGroup as ItemGroup,\n  __experimentalItem as Item,\n} from '@wordpress/components';\n\nfunction Example() {\n  return (\n    <ItemGroup>\n      <Item>Code</Item>\n      <Item>is</Item>\n      <Item>Poetry</Item>\n    </ItemGroup>\n  );\n}\n```",displayName:"Item",props:{size:{defaultValue:{value:"'medium'"},description:"Determines the amount of padding within the component.",name:"size",required:!1,type:{name:"enum",value:[{value:'"small"'},{value:'"large"'},{value:'"medium"'}]}},children:{defaultValue:null,description:"The children elements.",name:"children",required:!0,type:{name:"ReactNode"}},as:{defaultValue:null,description:"The HTML element or React component to render the component as.",name:"as",required:!1,type:{name:'"symbol" | "object" | "select" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | "base" | "bdi" | "bdo" | "big" | "blockquote" | "body" | "br" | "button" | ... 516 more ... | ("view" & FunctionComponent<...>)'}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["packages/components/src/item-group/item/component.tsx#Item"]={docgenInfo:Item.__docgenInfo,name:"Item",path:"packages/components/src/item-group/item/component.tsx#Item"})}catch(__react_docgen_typescript_loader_error){}},"./packages/components/src/item-group/styles.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{AS:()=>item,AV:()=>itemSizes,Ci:()=>separated,D5:()=>itemWrapper,DB:()=>unstyledButton,GN:()=>spacedAround,Wf:()=>rounded,sW:()=>bordered});var _emotion_react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/@emotion/react/dist/emotion-react.browser.esm.js"),_utils__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./packages/components/src/utils/font.js"),_utils__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./packages/components/src/utils/colors-values.js"),_utils__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./packages/components/src/utils/config-values.js");const unstyledButton=as=>(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("font-size:",(0,_utils__WEBPACK_IMPORTED_MODULE_1__.g)("default.fontSize"),";font-family:inherit;appearance:none;border:1px solid transparent;cursor:pointer;background:none;text-align:start;text-decoration:","a"===as?"none":void 0,";svg,path{fill:currentColor;}&:hover{color:",_utils__WEBPACK_IMPORTED_MODULE_2__.l.theme.accent,";}&:focus{box-shadow:none;outline:none;}&:focus-visible{box-shadow:0 0 0 var( --wp-admin-border-width-focus ) ",_utils__WEBPACK_IMPORTED_MODULE_2__.l.theme.accent,";outline:2px solid transparent;outline-offset:0;}",""),itemWrapper={name:"1bcj5ek",styles:"width:100%;display:block"},item={name:"150ruhm",styles:"box-sizing:border-box;width:100%;display:block;margin:0;color:inherit"},bordered=(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("border:1px solid ",_utils__WEBPACK_IMPORTED_MODULE_3__.A.surfaceBorderColor,";",""),separated=(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)(">*:not( marquee )>*{border-bottom:1px solid ",_utils__WEBPACK_IMPORTED_MODULE_3__.A.surfaceBorderColor,";}>*:last-of-type>*:not( :focus ){border-bottom-color:transparent;}",""),borderRadius=_utils__WEBPACK_IMPORTED_MODULE_3__.A.radiusSmall,spacedAround=(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("border-radius:",borderRadius,";",""),rounded=(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("border-radius:",borderRadius,";>*:first-of-type>*{border-top-left-radius:",borderRadius,";border-top-right-radius:",borderRadius,";}>*:last-of-type>*{border-bottom-left-radius:",borderRadius,";border-bottom-right-radius:",borderRadius,";}",""),baseFontHeight=`calc(${_utils__WEBPACK_IMPORTED_MODULE_3__.A.fontSize} * ${_utils__WEBPACK_IMPORTED_MODULE_3__.A.fontLineHeightBase})`,paddingY=`calc((${_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlHeight} - ${baseFontHeight} - 2px) / 2)`,paddingYSmall=`calc((${_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlHeightSmall} - ${baseFontHeight} - 2px) / 2)`,paddingYLarge=`calc((${_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlHeightLarge} - ${baseFontHeight} - 2px) / 2)`,itemSizes={small:(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("padding:",paddingYSmall," ",_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlPaddingXSmall,"px;",""),medium:(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("padding:",paddingY," ",_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlPaddingX,"px;",""),large:(0,_emotion_react__WEBPACK_IMPORTED_MODULE_0__.AH)("padding:",paddingYLarge," ",_utils__WEBPACK_IMPORTED_MODULE_3__.A.controlPaddingXLarge,"px;","")}}}]);