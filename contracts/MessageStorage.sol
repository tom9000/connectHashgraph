// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MessageStorage {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
        uint256 id;
    }
    
    Message[] private messages;
    mapping(address => uint256[]) private userMessages;
    uint256 private messageCounter;
    
    event MessageStored(
        uint256 indexed messageId,
        address indexed sender,
        string content,
        uint256 timestamp
    );
    
    constructor() {
        messageCounter = 0;
    }
    
    function storeMessage(string memory _content) external {
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 500, "Message too long");
        
        uint256 messageId = messageCounter;
        messageCounter++;
        
        Message memory newMessage = Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            id: messageId
        });
        
        messages.push(newMessage);
        userMessages[msg.sender].push(messageId);
        
        emit MessageStored(messageId, msg.sender, _content, block.timestamp);
    }
    
    function getMessage(uint256 _messageId) external view returns (
        address sender,
        string memory content,
        uint256 timestamp,
        uint256 id
    ) {
        require(_messageId < messages.length, "Message does not exist");
        
        Message memory message = messages[_messageId];
        return (message.sender, message.content, message.timestamp, message.id);
    }
    
    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }
    
    function getRecentMessages(uint256 _count) external view returns (
        address[] memory senders,
        string[] memory contents,
        uint256[] memory timestamps,
        uint256[] memory ids
    ) {
        uint256 totalMessages = messages.length;
        uint256 returnCount = _count > totalMessages ? totalMessages : _count;
        
        senders = new address[](returnCount);
        contents = new string[](returnCount);
        timestamps = new uint256[](returnCount);
        ids = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 messageIndex = totalMessages - 1 - i;
            Message memory message = messages[messageIndex];
            
            senders[i] = message.sender;
            contents[i] = message.content;
            timestamps[i] = message.timestamp;
            ids[i] = message.id;
        }
        
        return (senders, contents, timestamps, ids);
    }
    
    function getUserMessages(address _user) external view returns (uint256[] memory) {
        return userMessages[_user];
    }
    
    function getUserMessageCount(address _user) external view returns (uint256) {
        return userMessages[_user].length;
    }
}