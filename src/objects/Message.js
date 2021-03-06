const FreshObject = require('./FreshObject')
const axios = require('axios')

/**
 * An iFunny message sent by a user in a chat
 * @extends {FreshObject}
 */
class Message extends FreshObject {
    constructor(id, chat, opts = {}) {
        super(id, opts)
        this._invoked = null

        this.url = `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/${id}`
    }

    // methods

    /**
     * Get some value from this objects own internal JSON state
     * @param  {String}  key      key to query
     * @param  {*}  fallback=null fallback value, if no value is found for key
     * @return {Promise<*>}       retrieved data
     */
    async get(key, fallback = null) {
        let found = this._object_payload[key]

        if (found != undefined && !this.update) {
            this._update = false
            return found
        }

        this._update = false
        let response = await axios({
            method: 'get',
            url: this.url,
            headers: await this.sendbird_headers
        })

        this._object_payload = response.data
        return this._object_payload[key] || fallback
    }

    /**
     * Send a text message to a chat
     * @param  {String}             content Message content
     * @return {Promise<Message>}   This message instance
     */
    async send_text_message(content) {
        await (await this.chat)
        .send_text_message(content)
        return this
    }

    /**
     * Send an image message to a chat
     * @param {String}  url             Url pointing to this image
     * @param {Object} opts={}          Optional parameters
     * @param {Number} opts.height=780  Height of this image
     * @param {Number} opts.width=780   Width of this image
     * @param {String} opts.file_name   File name to send this file as
     * @param {String} opts.file_type   MIME type of this file
     * @return {Promise<Message>}       This message instance
     */
    async send_image_message(url, opts = {}) {
        await (await this.chat)
        .send_image_message(url, opts)
        return this
    }

    /**
     * Mark this message as read
     * @return {Promise<Message>} This message instance
     */
    async read() {
        await (await this.chat)
        .read()
        return this
    }

    /**
     * Delete this chat message
     * @return {Promise<Message>} This message instance
     */
    async delete() {
        await this.client.delete_chat_message(await this.chat, this)
        return this
    }

    async edit(content) {
        await this.client.edit_chat_text_message(await this.chat, this, content)
        return this.fresh
    }

    // getters

    /**
     * Content of this message
     * @type {Promise<String>}
     */
    get content() {
        return this.get('message') || ''
    }

    /**
     * The author of this message
     * @type {Promise<ChatUser>}
     */
    get author() {
        return (async () => {
            let data = await this.get('user')

            if (data) {
                let ChatUser = require('./ChatUser')
                return new ChatUser(data.user_id || data.guest_id, (await this.chat), { client: this.client, data: data })
            }

            return null
        })()
    }

    /**
     * The chat that this message was sent in
     * @type {Promise<Chat>}
     */
    get chat() {
        return (async () => {
            let Chat = require('./Chat')
            return new Chat((await this.get('channel_url')), { client: this.client })
        })()
    }

    /**
     * Timestamp of message recieved in seconds
     * @type {Promise<Number>}
     */
    get recieved_at() {
        return (async () => {
            return Math.trunc((await this.get('ts')) / 1000)
        })()
    }

    /**
     * Alias to `Message.send_text_message`
     * @type {Promise<Method>}
     */
    get reply() {
        return this.send_text_message
    }

    /**
     * Type of message
     * Normal text messages will return `MESG`
     * Messages with files attached will return `FILE`
     * Info messages will return `ADMM`
     * @type {Promise<String>}
     */
    get type() {
        return (async () => {
            let type = this.get('type')
            return type == 'MESG'
        })
    }

    /**
     * mimetype of this messages file, if any
     * @type {Promise<String|Null>}
     */
    get file_mime() {
        // fresh data and local data are not consistent
        // local -> mime type (for files)
        // fresh -> 'FILE' or ''
        return (async () => {
            let mime = this.get('type')
            return mime != 'MESG' ? mime : null
        })()
    }

    /**
     * Metadata about the file in this message
     * @type {Promise<Object>}
     */
    get file_meta() {
        return this.get('file', {})
    }

    /**
     * Ulr to the file in this message, if any
     * @type {Promise<String|Null>}
     */
    get file_url() {
        return (async () => {
            return (await this.file_meta)
                .url || null
        })()
    }

    /**
     * Name of the file in this image, if any
     * @type {Promise<String|Null>}
     */
    get file_name() {
        return (async () => {
            return (await this.file_meta)
                .name || null
        })()
    }

    get invoked() {
        return (async () => {
            return this._invoked
        })()
    }

    set invoked(field) {
        this._invoked = field
    }

    /**
     * Message creation timestamp in ms
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get('created_at')
    }

    get channel_type() {
        return this.get('channel_type')
    }

    get channel_id() {
        return this.get('channel_id')
    }

    get is_guest_msg() {
        return this.get('is_guest_msg')
    }

    get is_removed() {
        return this.get('is_removed')
    }

    get sts() {
        return this.get('sts')
    }

    get custom_type() {
        return this.get('custom_type')
    }

    get mention_type() {
        return this.get('mention_type')
    }

    get mentioned_users() {
        return this.get('mentioned_users')
    }

    get is_op_msg() {
        return this.get('is_op_msg')
    }

    get is_super() {
        return this.get('is_super')
    }

}

module.exports = Message
