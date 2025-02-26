// src/components/messaging/MessagesList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Badge,
  Paper,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

// Material UI icons
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';

  const MessagesList = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
 
 useEffect(() => {
   fetchMessages();
 }, [user]);
 
 const fetchMessages = async () => {
   setLoading(true);
   setError('');
   
   try {
     const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
     
     // Fetch all messages for the current user
     const messagesResponse = await fetch(
       `${apiUrl}/messages?senderId=${user.id}&_sort=createdAt&_order=desc` + 
       `&_limit=100` +
       `&_embed=receiverId`
     );
     
     if (!messagesResponse.ok) {
       throw new Error('Failed to fetch sent messages');
     }
     
     const sentMessages = await messagesResponse.json();
     
     const receivedMessagesResponse = await fetch(
       `${apiUrl}/messages?receiverId=${user.id}&_sort=createdAt&_order=desc` + 
       `&_limit=100` +
       `&_embed=senderId`
     );
     
     if (!receivedMessagesResponse.ok) {
       throw new Error('Failed to fetch received messages');
     }
     
     const receivedMessages = await receivedMessagesResponse.json();
     
     // Combine and sort messages by createdAt (newest first)
     const allMessages = [...sentMessages, ...receivedMessages]
       .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
     
     setMessages(allMessages);
     
     // Extract unique contacts
     const uniqueContacts = new Set();
     
     allMessages.forEach(message => {
       if (message.senderId === user.id) {
         uniqueContacts.add(message.receiverId);
       } else {
         uniqueContacts.add(message.senderId);
       }
     });
     
     // Fetch user info for all contacts
     const usersData = {};
     
     for (const userId of uniqueContacts) {
       const userResponse = await fetch(`${apiUrl}/users/${userId}`);
       if (userResponse.ok) {
         const userData = await userResponse.json();
         usersData[userId] = userData;
       }
     }
     
     setUsers(usersData);
     
     // Generate contacts list with last message
     const contactsWithLastMessage = Array.from(uniqueContacts).map(contactId => {
       // Find the most recent message for this contact
       const lastMessage = allMessages.find(msg => 
         (msg.senderId === contactId && msg.receiverId === user.id) || 
         (msg.senderId === user.id && msg.receiverId === contactId)
       );
       
       // Count unread messages from this contact
       const unreadCount = allMessages.filter(msg => 
         msg.senderId === contactId && 
         msg.receiverId === user.id && 
         msg.read === false
       ).length;
       
       return {
         id: contactId,
         user: usersData[contactId],
         lastMessage,
         unreadCount
       };
     });
     
     // Sort contacts by lastMessage timestamp (newest first)
     contactsWithLastMessage.sort((a, b) => 
       new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
     );
     
     setContacts(contactsWithLastMessage);
     
     // If there are contacts and none is selected, select the first one
     if (contactsWithLastMessage.length > 0 && !selectedContact) {
       setSelectedContact(contactsWithLastMessage[0]);
     }
   } catch (err) {
     console.error('Error fetching messages:', err);
     setError('Failed to load messages. Please try again later.');
   } finally {
     setLoading(false);
   }
 };
 
 const markAsRead = async (messages) => {
   try {
     const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
     
     // Update each message to mark it as read
     const updatePromises = messages.map(message => 
       fetch(`${apiUrl}/messages/${message.id}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ read: true }),
       })
     );
     
     await Promise.all(updatePromises);
     
     // Update local state
     setMessages(prevMessages => 
       prevMessages.map(msg => {
         if (messages.some(m => m.id === msg.id)) {
           return { ...msg, read: true };
         }
         return msg;
       })
     );
     
     // Update unread count in contacts
     setContacts(prevContacts => 
       prevContacts.map(contact => {
         if (contact.id === selectedContact.id) {
           return { ...contact, unreadCount: 0 };
         }
         return contact;
       })
     );
   } catch (err) {
     console.error('Error marking messages as read:', err);
   }
 };
 
 const handleContactSelect = (contact) => {
   setSelectedContact(contact);
   
   // Mark unread messages from this contact as read
   const unreadMessages = messages.filter(msg => 
     msg.senderId === contact.id && 
     msg.receiverId === user.id && 
     !msg.read
   );
   
   if (unreadMessages.length > 0) {
     markAsRead(unreadMessages);
   }
 };
 
 const handleSendMessage = async () => {
   if (!messageContent.trim() || !selectedContact) return;
   
   setSending(true);
   setSendError('');
   
   try {
     const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
     
     const newMessage = {
       senderId: user.id,
       receiverId: selectedContact.id,
       content: messageContent,
       createdAt: new Date().toISOString(),
       read: false,
     };
     
     const response = await fetch(`${apiUrl}/messages`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(newMessage),
     });
     
     if (!response.ok) {
       throw new Error('Failed to send message');
     }
     
     const savedMessage = await response.json();
     
     // Update messages list with the new message
     setMessages(prev => [savedMessage, ...prev]);
     
     // Update the selected contact's last message
     setContacts(prev => 
       prev.map(contact => {
         if (contact.id === selectedContact.id) {
           return {
             ...contact,
             lastMessage: savedMessage,
           };
         }
         return contact;
       })
     );
     
     // Clear message input
     setMessageContent('');
   } catch (err) {
     console.error('Error sending message:', err);
     setSendError('Failed to send message. Please try again.');
   } finally {
     setSending(false);
   }
 };
 
 // Format date for display
 const formatMessageDate = (dateString) => {
   const date = new Date(dateString);
   const now = new Date();
   const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
   
   if (diffDays === 0) {
     // Today - show time
     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   } else if (diffDays === 1) {
     return 'Yesterday';
   } else if (diffDays < 7) {
     // This week - show day of week
     return date.toLocaleDateString([], { weekday: 'short' });
   } else {
     // Older - show date
     return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
   }
 };
 
 // Get messages for the selected contact
 const getConversation = () => {
   if (!selectedContact) return [];
   
   return messages
     .filter(msg => 
       (msg.senderId === user.id && msg.receiverId === selectedContact.id) ||
       (msg.senderId === selectedContact.id && msg.receiverId === user.id)
     )
     .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by createdAt (oldest first)
 };
 
 return (
   <Box sx={{ display: 'flex', height: '70vh', borderRadius: 1, overflow: 'hidden' }}>
     {/* Contacts list */}
     <Paper sx={{ width: 320, borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
       <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <Typography variant="h6">Messages</Typography>
         <IconButton onClick={fetchMessages} disabled={loading}>
           {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
         </IconButton>
       </Box>
       
       {error && (
         <Alert severity="error" sx={{ m: 2 }}>
           {error}
         </Alert>
       )}
       
       <List sx={{ overflow: 'auto', flexGrow: 1 }}>
         {contacts.length === 0 ? (
           <Box sx={{ p: 2, textAlign: 'center' }}>
             <Typography variant="body2" color="text.secondary">
               No messages yet
             </Typography>
           </Box>
         ) : (
           contacts.map(contact => (
             <ListItem
               key={contact.id}
               button
               selected={selectedContact?.id === contact.id}
               onClick={() => handleContactSelect(contact)}
               sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
             >
               <ListItemAvatar>
                 <Badge
                   color="error"
                   badgeContent={contact.unreadCount}
                   invisible={contact.unreadCount === 0}
                 >
                   <Avatar>
                     {contact.user?.firstName?.[0]}{contact.user?.lastName?.[0]}
                   </Avatar>
                 </Badge>
               </ListItemAvatar>
               <ListItemText
                 primary={
                   <Typography
                     variant="subtitle2"
                     fontWeight={contact.unreadCount > 0 ? 'bold' : 'normal'}
                   >
                     {contact.user?.firstName} {contact.user?.lastName}
                   </Typography>
                 }
                 secondary={
                   <Typography
                     variant="body2"
                     color="text.secondary"
                     fontWeight={contact.unreadCount > 0 ? 'bold' : 'normal'}
                     noWrap
                   >
                     {contact.lastMessage?.senderId === user.id ? 'You: ' : ''}
                     {contact.lastMessage?.content}
                   </Typography>
                 }
               />
               <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                 {contact.lastMessage && formatMessageDate(contact.lastMessage.createdAt)}
               </Typography>
             </ListItem>
           ))
         )}
       </List>
     </Paper>
     
     {/* Conversation area */}
     <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
       {selectedContact ? (
         <>
           {/* Conversation header */}
           <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
             <Avatar sx={{ mr: 2 }}>
               {selectedContact.user?.firstName?.[0]}{selectedContact.user?.lastName?.[0]}
             </Avatar>
             <Typography variant="h6">
               {selectedContact.user?.firstName} {selectedContact.user?.lastName}
             </Typography>
             
             {/* Mark all as read button */}
             {selectedContact.unreadCount > 0 && (
               <IconButton
                 color="primary"
                 onClick={() => {
                   const unreadMessages = messages.filter(msg => 
                     msg.senderId === selectedContact.id && 
                     msg.receiverId === user.id && 
                     !msg.read
                   );
                   
                   if (unreadMessages.length > 0) {
                     markAsRead(unreadMessages);
                   }
                 }}
                 sx={{ ml: 'auto' }}
               >
                 <MarkChatReadIcon />
               </IconButton>
             )}
           </Box>
           
           {/* Messages area */}
           <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
             <Box>
               {getConversation().map((message, index) => {
                 const isUserMessage = message.senderId === user.id;
                 
                 return (
                   <Box
                     key={message.id}
                     sx={{
                       display: 'flex',
                       justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
                       mb: 2,
                     }}
                   >
                     {!isUserMessage && (
                       <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                         {selectedContact.user?.firstName?.[0]}{selectedContact.user?.lastName?.[0]}
                       </Avatar>
                     )}
                     
                     <Box
                       sx={{
                         maxWidth: '75%',
                         p: 2,
                         borderRadius: 2,
                         bgcolor: isUserMessage ? 'primary.main' : 'grey.100',
                         color: isUserMessage ? 'white' : 'text.primary',
                       }}
                     >
                       <Typography variant="body1">{message.content}</Typography>
                       <Typography
                         variant="caption"
                         sx={{
                           display: 'block',
                           textAlign: 'right',
                           mt: 0.5,
                           color: isUserMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                         }}
                       >
                         {formatMessageDate(message.createdAt)}
                       </Typography>
                     </Box>
                     
                     {isUserMessage && (
                       <Avatar sx={{ ml: 1, width: 32, height: 32 }}>
                         {user?.firstName?.[0]}{user?.lastName?.[0]}
                       </Avatar>
                     )}
                   </Box>
                 );
               })}
             </Box>
           </Box>
           
           {/* Message input */}
           <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
             {sendError && (
               <Alert severity="error" sx={{ mb: 2 }}>
                 {sendError}
               </Alert>
             )}
             
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <TextField
                 fullWidth
                 placeholder="Type a message..."
                 value={messageContent}
                 onChange={(e) => setMessageContent(e.target.value)}
                 onKeyPress={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage();
                   }
                 }}
                 disabled={sending}
                 multiline
                 maxRows={3}
                 variant="outlined"
                 sx={{ mr: 1 }}
               />
               <Button
                 variant="contained"
                 endIcon={<SendIcon />}
                 onClick={handleSendMessage}
                 disabled={!messageContent.trim() || sending}
               >
                 Send
               </Button>
             </Box>
           </Box>
         </>
       ) : (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
           <Typography variant="body1" color="text.secondary">
             Select a conversation to view messages
           </Typography>
         </Box>
       )}
     </Paper>
   </Box>
 );
};

export default MessagesList;