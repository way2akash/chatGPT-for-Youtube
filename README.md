# youtube summariser




## Installation
>Make sure you have latest **NodeJs** version installed

Clone repo

```
git clone https://github.com/way2akash/chatGPT-for-Youtube.git
```
Go to `chatGPT-for-Youtube` directory run

```
npm install
```
Now build the extension using
```
npm run build
```
You will see a `build` folder generated inside `[PROJECT_HOME]`


## Adding React app extension to Chrome

In Chrome browser, go to chrome://extensions page and switch on developer mode. This enables the ability to locally install a Chrome extension.


Now click on the `LOAD UNPACKED` and browse to `[PROJECT_HOME]\build` ,This will install the React app as a Chrome extension.

When you go to any website and click on extension icon, injected page will toggle.

