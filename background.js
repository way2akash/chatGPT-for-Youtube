
chrome.runtime.onInstalled.addListener((e) => {
    const logo = chrome.runtime.getURL("assests/icon 64.png");

    chrome.notifications.create(
        "name-for-notification",
        {
            type: "basic",
            iconUrl: logo,
            title: "ChatGPT Summarizer for YouTube",
            message: `ChatGPT Summarizer for YouTube has been installed`,
        })

}
)



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const { status } = changeInfo
    if (status === "complete" && tab.url.includes("watch?v")) {
        chrome.tabs.sendMessage(tabId, { update: "updated" });

    }
})




const setToStorage = (key, data) => {
    const obj = {}
    obj[key] = data
    chrome.storage.sync.set(obj)
}

const getFromStorage = async (key) => {
    const sres = await chrome.storage.sync.get(key)
    return sres[key]
}

const fetchAPI = async (url, config) => {
    try {
        let response = await fetch(url, config)
        return response.json()
    } catch (err) {
        return Promise.reject(err)
    }
}

const uuidv4 = () => {
    return crypto.randomUUID()
}

var handleError = function (err) {
    return null
};

const getAccessToken = async () => {
    const url = "https://chat.openai.com/api/auth/session"
    const config = {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    const response = await (fetch(url, config).catch(handleError))

    if (!response.ok) {
        throw new Error()
    }

    return response.json()
}

const getAllConversations = async (at) => {
    const url = "https://chat.openai.com/backend-api/conversations?offset=0&limit=20"

    const config = {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${at}`
        }
    }

    return await fetchAPI(url, config)
}

const createConversation = async (at, query, tabId) => {
    const url = "https://chat.openai.com/backend-api/conversation"

    const config = {
        method: 'POST',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${at}`
        },
        body: JSON.stringify({
            action: "next",
            messages: [{
                id: uuidv4(),
                role: "user",
                content: {
                    content_type: "text",
                    parts: [query]
                }
            }],
            model: "text-davinci-002-render-sha",
            parent_message_id: uuidv4()
        })
    }

    let response = await fetch(url, config)

    if (!response.ok) {
        let cErr = await response.json();

        if (typeof cErr === "object") {
            if (cErr.detail.message) {
                throw new Error(cErr.detail.message);
            } else if (cErr.detail) {
                throw new Error(cErr.detail);

            }

        } else {
            throw new Error("Something went wrong");
        }
    } else {
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            if (value.includes('data:')) {
                let parsedResponse = transform(value)
                if (parsedResponse && typeof parsedResponse === 'object' && !parsedResponse?.error) {
                    let answer = parsedResponse?.message?.content?.parts[0]

                    chrome.tabs.sendMessage(tabId, { message: 'answer', answer })
                }
            }
        }
    }

}

const transform = (s) => {
    let value = s.split("data: ")[1]

    if (IsJsonString(value)) {
        return JSON.parse(value)
    }

    return null
}

const IsJsonString = (str) => {
    try {
        if (typeof str !== 'string') return false

        var json = JSON.parse(str)
        return (typeof json === 'object')
    } catch (e) {
        return false;
    }
}

const main = async (query, tabId) => {
    let at = await getFromStorage('accessToken')

    if (!at) {
        // send message to content -type: "auth-error", message: "Please login"
        return
    }

    try {
        let response = await createConversation(at, query, tabId)


    } catch (err) {
        return err.message

    }
}

const sessionCheckAndSet = async () => {
    try {
        let userObj = await getAccessToken()

        let at = userObj ? userObj['accessToken'] : ''
        await setToStorage('accessToken', at)

        // stoarage updated
    } catch (err) {
        await setToStorage('accessToken', '')
        // send message too content -type: "error", message: "Something went wrong"

    }
}

(async () => {
    await sessionCheckAndSet()
})()

const buildQuery = (q) => {
    if (q.length > 15000) {
        return q.slice(1, 15000)
    } else {
        return q

    }
}

chrome.runtime.onMessage.addListener(async function (response, sender, sendResponse) {
    const { message } = response
    const tabId = sender.tab.id

    if (message === 'search-occured') {
        let { query } = response

        query = buildQuery(query)

        let answer = await main(`Summarize the following. ${query}`, tabId)
        if (answer != undefined) {
            chrome.tabs.sendMessage(tabId, { message: 'answer', answer })

        }

    } else if (message === 'session-check') {
        await sessionCheckAndSet()
        chrome.tabs.sendMessage(tabId, { message: 'session-updated' })


    } else if (message === 'session-initial-check') {
        await sessionCheckAndSet()
        chrome.tabs.sendMessage(tabId, { message: 'session-updated' })
    }
})



