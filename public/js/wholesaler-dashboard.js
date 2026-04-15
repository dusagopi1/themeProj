// DOM elements
const userNameElement = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const bidsContainer = document.getElementById('bids-container');
const bidTemplate = document.getElementById('bid-template');
const chatsContainer = document.getElementById('chats-container');
const chatTemplate = document.getElementById('chat-template');

// Analytics DOM elements
const totalSpentElement = document.getElementById('total-spent');
const productsBoughtElement = document.getElementById('products-bought');
const activeBidsElement = document.getElementById('active-bids');
const bidsWonElement = document.getElementById('bids-won');
const avgPurchaseElement = document.getElementById('avg-purchase');
const totalQtyBoughtElement = document.getElementById('total-qty-bought');
const winRateElement = document.getElementById('win-rate');

// Check auth state
auth.onAuthStateChanged(user => {
    if (user) {
        // Get user data
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    // Verify this is a wholesaler account
                    if (userData.userType !== 'wholesaler') {
                        window.location.href = 'index.html';
                        return;
                    }
                    
                    // Display user name
                    userNameElement.textContent = userData.name;
                    
                    // Load winning bids, active chats, and analytics
                    loadWinningBids(user.uid);
                    loadActiveChats(user.uid);
                    loadWholesalerAnalytics(user.uid);
                } else {
                    console.error('User document not found');
                    auth.signOut();
                    window.location.href = 'index.html';
                }
            })
            .catch(err => {
                console.error('Error fetching user data:', err);
                alert('Error fetching user data');
            });
    } else {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
    }
});

// Logout function
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(err => {
            console.error('Logout error:', err);
        });
});

// Load wholesaler's winning bids
function loadWinningBids(wholesalerId) {
    // Clear the loading placeholder
    bidsContainer.innerHTML = '';
    
    db.collection('bids')
        .where('wholesalerId', '==', wholesalerId)
        .where('status', '==', 'accepted')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                bidsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You haven't won any bids yet. <a href="product-listing.html" class="text-green-600 hover:text-green-800">Start bidding now</a>.</p>
                    </div>
                `;
                return;
            }
            
            // Sort bids by createdAt in descending order (newest first)
            const sortedBids = snapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }).sort((a, b) => {
                // Note: Firebase timestamps need to be converted to Date objects for comparison
                const dateA = a.createdAt?.toDate() || new Date(0);
                const dateB = b.createdAt?.toDate() || new Date(0);
                return dateB - dateA; // Descending order (newest first)
            });
            
            // Process each bid using the sorted array
            const promises = sortedBids.map(bid => {
                // Get the product details
                return db.collection('products').doc(bid.productId).get()
                    .then(productDoc => {
                        if (productDoc.exists) {
                            const product = productDoc.data();
                            return { bid, product, bidId: bid.id, productId: productDoc.id };
                        }
                        return null;
                    });
            });
            
            // Process all bids
            Promise.all(promises)
                .then(results => {
                    // Filter out null results and render bids
                    results
                        .filter(result => result !== null)
                        .forEach(result => {
                            const bidElement = createBidElement(result.bid, result.product, result.bidId, result.productId);
                            bidsContainer.appendChild(bidElement);
                        });
                        
                    if (bidsContainer.children.length === 0) {
                        bidsContainer.innerHTML = `
                            <div class="col-span-full flex items-center justify-center h-32">
                                <p class="text-gray-500">No bid information found. <a href="product-listing.html" class="text-green-600 hover:text-green-800">Start bidding now</a>.</p>
                            </div>
                        `;
                    }
                });
        })
        .catch(err => {
            console.error('Error loading bids:', err);
            bidsContainer.innerHTML = `
                <div class="col-span-full flex items-center justify-center h-32">
                    <p class="text-red-500">Error loading bids. Please try again.</p>
                </div>
            `;
        });
}

// Create bid element from template
function createBidElement(bid, product, bidId, productId) {
    const element = bidTemplate.content.cloneNode(true);
    
    // Populate bid data
    element.querySelector('.product-name').textContent = product.name;
    element.querySelector('.product-details').textContent = 
        `${product.quantity} ${product.unit} - ${product.farmingMethod}`;
    element.querySelector('.bid-amount').textContent = bid.amount;
    element.querySelector('.product-location').textContent = `${product.district}, ${product.state}`;
    
    // Set contact farmer button action to open chat
    element.querySelector('.contact-farmer-btn').addEventListener('click', () => {
        window.location.href = `chat.html?id=${productId}`;
    });
    
    return element;
}

// Load active chats for wholesaler
function loadActiveChats(wholesalerId) {
    // Clear any loading placeholder
    if (chatsContainer) {
        chatsContainer.innerHTML = '';
    } else {
        console.error('Chats container not found');
        return;
    }
    
    // Query chats where the current user is the wholesaler
    // Using a simpler query without complex ordering to avoid index requirements
    db.collection('chats')
        .where('wholesalerId', '==', wholesalerId)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                chatsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You don't have any active chats yet. When your bid is accepted, you can chat with the farmer here.</p>
                    </div>
                `;
                return;
            }
            
            // Process each chat document
            const chatPromises = snapshot.docs.map(doc => {
                const chatData = doc.data();
                const chatId = doc.id;
                
                // Get farmer info
                return db.collection('users').doc(chatData.farmerId).get()
                    .then(userDoc => {
                        if (userDoc.exists) {
                            return {
                                id: chatId,
                                ...chatData,
                                farmerName: userDoc.data().name
                            };
                        }
                        return null;
                    });
            });
            
            // Process all chat promises
            return Promise.all(chatPromises);
        })
        .then(chatsWithUserData => {
            // Filter out any null values
            const validChats = chatsWithUserData ? chatsWithUserData.filter(chat => chat !== null) : [];
            
            if (validChats.length === 0) {
                chatsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You don't have any active chats yet. When your bid is accepted, you can chat with the farmer here.</p>
                    </div>
                `;
                return;
            }
            
            // Sort chats by last updated time if available
            validChats.sort((a, b) => {
                const timeA = a.lastUpdated ? a.lastUpdated.toDate() : a.createdAt ? a.createdAt.toDate() : new Date(0);
                const timeB = b.lastUpdated ? b.lastUpdated.toDate() : b.createdAt ? b.createdAt.toDate() : new Date(0);
                return timeB - timeA; // Most recent first
            });
            
            // Create and append chat elements
            validChats.forEach(chat => {
                const chatElement = createChatElement(chat);
                chatsContainer.appendChild(chatElement);
            });
        })
        .catch(err => {
            console.error('Error loading chats:', err);
            chatsContainer.innerHTML = `
                <div class="col-span-full flex items-center justify-center h-32">
                    <p class="text-red-500">Error loading chats. Please try again.</p>
                </div>
            `;
        });
}

// Create chat element from template
function createChatElement(chat) {
    if (!chatTemplate) {
        console.error('Chat template not found');
        return document.createElement('div');
    }
    
    const element = chatTemplate.content.cloneNode(true);
    
    // Populate chat data
    element.querySelector('.chat-product-name').textContent = chat.productName || 'Product';
    
    // Set amount
    const amountElement = element.querySelector('.chat-amount');
    amountElement.textContent = `₹${chat.amount}`;
    
    // Set farmer name
    element.querySelector('.chat-with').textContent = `Chat with ${chat.farmerName}`;
    
    // Set time info
    const timeElement = element.querySelector('.chat-time');
    if (chat.lastUpdated) {
        timeElement.textContent = `Updated ${formatTimeAgo(chat.lastUpdated.toDate())}`;
    } else if (chat.createdAt) {
        timeElement.textContent = `Created ${formatTimeAgo(chat.createdAt.toDate())}`;
    } else {
        timeElement.textContent = 'Recently';
    }
    
    // Set open chat button action
    element.querySelector('.open-chat-btn').addEventListener('click', () => {
        // Extract the product ID from the chat ID if it follows the format product_[productId]
        const productId = chat.productId || chat.id.replace('product_', '');
        window.location.href = `chat.html?id=${productId}`;
    });
    
    return element;
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin}m ago`;
    } else if (diffHour < 24) {
        return `${diffHour}h ago`;
    } else if (diffDay < 7) {
        return `${diffDay}d ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
}

// Load wholesaler analytics
function loadWholesalerAnalytics(wholesalerId) {
    // Initialize analytics values
    let totalSpent = 0;
    let productsBought = 0;
    let activeBids = 0;
    let bidsWon = 0;
    let totalBids = 0;
    let totalQuantityBought = 0;

    // Get products purchased by this wholesaler
    db.collection('products')
        .where('soldTo', '==', wholesalerId)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const product = doc.data();
                productsBought++;
                totalSpent += product.winningBid || product.currentBid || product.minimumBid || 0;
                
                // Calculate quantity bought
                const qty = parseFloat(product.quantity) || 0;
                totalQuantityBought += qty;
            });

            // Get all bids by this wholesaler
            return db.collection('bids')
                .where('wholesalerId', '==', wholesalerId)
                .get();
        })
        .then(bidsSnapshot => {
            bidsSnapshot.forEach(doc => {
                const bid = doc.data();
                totalBids++;
                
                if (bid.status === 'pending') {
                    activeBids++;
                } else if (bid.status === 'accepted' || bid.status === 'won') {
                    bidsWon++;
                }
            });
            
            // Update UI with analytics
            updateWholesalerAnalyticsUI(totalSpent, productsBought, activeBids, bidsWon, totalBids, totalQuantityBought);
        })
        .catch(err => {
            console.error('Error loading analytics:', err);
        });
}

// Update wholesaler analytics UI
function updateWholesalerAnalyticsUI(spent, bought, active, won, totalBids, quantity) {
    // Format amount with Indian number format
    if (totalSpentElement) {
        totalSpentElement.textContent = `₹${spent.toLocaleString('en-IN')}`;
    }
    
    if (productsBoughtElement) {
        productsBoughtElement.textContent = bought;
    }
    
    if (activeBidsElement) {
        activeBidsElement.textContent = active;
    }
    
    if (bidsWonElement) {
        bidsWonElement.textContent = won;
    }
    
    // Calculate and display average purchase
    if (avgPurchaseElement) {
        const avgPurchase = bought > 0 ? Math.round(spent / bought) : 0;
        avgPurchaseElement.textContent = `₹${avgPurchase.toLocaleString('en-IN')}`;
    }
    
    // Display total quantity bought
    if (totalQtyBoughtElement) {
        totalQtyBoughtElement.textContent = `${quantity} kg`;
    }
    
    // Calculate and display win rate
    if (winRateElement) {
        const rate = totalBids > 0 ? Math.round((won / totalBids) * 100) : 0;
        winRateElement.textContent = `${rate}%`;
    }
}
