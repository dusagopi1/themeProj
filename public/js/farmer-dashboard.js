// DOM elements
const userNameElement = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const productsContainer = document.getElementById('products-container');
const productTemplate = document.getElementById('product-template');
const chatsContainer = document.getElementById('chats-container');
const chatTemplate = document.getElementById('chat-template');

// Analytics DOM elements
const totalRevenueElement = document.getElementById('total-revenue');
const productsSoldElement = document.getElementById('products-sold');
const activeListingsElement = document.getElementById('active-listings');
const totalBidsElement = document.getElementById('total-bids');
const avgSalePriceElement = document.getElementById('avg-sale-price');
const totalQuantityElement = document.getElementById('total-quantity');
const conversionRateElement = document.getElementById('conversion-rate');

// Check auth state
auth.onAuthStateChanged(user => {
    if (user) {
        // Get user data
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    // Verify this is a farmer account
                    if (userData.userType !== 'farmer') {
                        window.location.href = 'index.html';
                        return;
                    }
                    
                    // Display user name
                    userNameElement.textContent = userData.name;
                    
                    // Load farmer's products, chats, and analytics
                    loadProducts(user.uid);
                    loadActiveChats(user.uid);
                    loadFarmerAnalytics(user.uid);
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

// Load farmer's products
function loadProducts(farmerId) {
    // Clear the loading placeholder
    productsContainer.innerHTML = '';
    
    // Option 1: Use only the where clause (no sorting)
db.collection('products')
        .where('farmerId', '==', farmerId)
        .get()
        
// If you prefer sorting, comment out the code above and uncomment this:
// db.collection('products')
//         .get()
//         .then(snapshot => {
//             const filtered = snapshot.docs
//                 .filter(doc => doc.data().farmerId === farmerId)
//                 .sort((a, b) => {
//                     const dateA = a.data().createdAt && a.data().createdAt.toDate ? a.data().createdAt.toDate() : new Date(0);
//                     const dateB = b.data().createdAt && b.data().createdAt.toDate ? b.data().createdAt.toDate() : new Date(0);
//                     return dateB - dateA; // descending order
//                 });
//             
//             if (filtered.length === 0) {
//                 productsContainer.innerHTML = `
//                     <div class="col-span-full flex items-center justify-center h-32">
//                         <p class="text-gray-500">You haven't listed any products yet.</p>
//                     </div>
//                 `;
//                 return;
//             }
//             
//             filtered.forEach(doc => {
//                 const product = doc.data();
//                 const productId = doc.id;
//                 const productElement = createProductElement(product, productId);
//                 productsContainer.appendChild(productElement);
//             });
//         })
        .then(snapshot => {
            if (snapshot.empty) {
                productsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You haven't listed any products yet.</p>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const productElement = createProductElement(product, productId);
                productsContainer.appendChild(productElement);
            });
        })
        .catch(err => {
            console.error('Error loading products:', err);
            productsContainer.innerHTML = `
                <div class="col-span-full flex items-center justify-center h-32">
                    <p class="text-red-500">Error loading products. Please try again.</p>
                </div>
            `;
        });
}

// Create product element from template
function createProductElement(product, productId) {
    const element = productTemplate.content.cloneNode(true);
    
    // Populate product data
    element.querySelector('.product-name').textContent = product.name;
    
    // Set status styling
    const statusElement = element.querySelector('.product-status');
    
    // Calculate if bidding is still active
    const now = new Date();
    const startTime = product.biddingStartTime.toDate();
    const durationMs = product.biddingDuration * 60 * 1000; // Convert minutes to milliseconds
    const endTime = new Date(startTime.getTime() + durationMs);
    const isActive = now < endTime;
    
    if (product.status === 'sold') {
        statusElement.textContent = 'SOLD';
        statusElement.classList.add('bg-blue-100', 'text-blue-800');
    } else if (!isActive) {
        statusElement.textContent = 'EXPIRED';
        statusElement.classList.add('bg-gray-100', 'text-gray-800');
    } else {
        statusElement.textContent = 'ACTIVE';
        statusElement.classList.add('bg-green-100', 'text-green-800');
    }
    
    // Set product details
    element.querySelector('.product-details').textContent = 
        `${product.quantity} ${product.unit} - ${product.farmingMethod}`;
    
    // Set minimum bid price
    element.querySelector('.product-bid').textContent = product.minimumBid;
    
    // Set time info
    let timeText = '';
    if (product.status === 'sold') {
        timeText = 'Sold on ' + formatDate(product.soldAt.toDate());
    } else if (!isActive) {
        timeText = 'Bidding ended on ' + formatDate(endTime);
    } else {
        // Calculate time remaining
        const timeRemaining = getTimeRemaining(endTime);
        timeText = `${timeRemaining} remaining`;
    }
    element.querySelector('.product-time').textContent = timeText;
    
    // Set view details button action
    element.querySelector('.view-bids-btn').addEventListener('click', () => {
        window.location.href = `product-details.html?id=${productId}`;
    });
    
    return element;
}

// Format date to readable string
function formatDate(date) {
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate time remaining as string
function getTimeRemaining(endTime) {
    const now = new Date();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
}

// Load active chats for farmer
function loadActiveChats(farmerId) {
    // Clear any loading placeholder
    if (chatsContainer) {
        chatsContainer.innerHTML = '';
    } else {
        console.error('Chats container not found');
        return;
    }
    
    // Query chats where the current user is the farmer
    // Using a simpler query without complex ordering to avoid index requirements
    db.collection('chats')
        .where('farmerId', '==', farmerId)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                chatsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You don't have any active chats yet. When you accept a bid, you can chat with the wholesaler here.</p>
                    </div>
                `;
                return;
            }
            
            // Process each chat document
            const chatPromises = snapshot.docs.map(doc => {
                const chatData = doc.data();
                const chatId = doc.id;
                
                // Get wholesaler info
                return db.collection('users').doc(chatData.wholesalerId).get()
                    .then(userDoc => {
                        if (userDoc.exists) {
                            return {
                                id: chatId,
                                ...chatData,
                                wholesalerName: userDoc.data().name
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
            const validChats = chatsWithUserData.filter(chat => chat !== null);
            
            if (validChats.length === 0) {
                chatsContainer.innerHTML = `
                    <div class="col-span-full flex items-center justify-center h-32">
                        <p class="text-gray-500">You don't have any active chats yet. When you accept a bid, you can chat with the wholesaler here.</p>
                    </div>
                `;
                return;
            }
            
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
    
    // Set wholesaler name
    element.querySelector('.chat-with').textContent = `Chat with ${chat.wholesalerName}`;
    
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

// Load farmer analytics
function loadFarmerAnalytics(farmerId) {
    // Initialize analytics values
    let totalRevenue = 0;
    let productsSold = 0;
    let activeListings = 0;
    let totalBids = 0;
    let totalQuantitySold = 0;
    let totalProducts = 0;

    // Get all products by this farmer
    db.collection('products')
        .where('farmerId', '==', farmerId)
        .get()
        .then(snapshot => {
            const now = new Date();
            
            snapshot.forEach(doc => {
                const product = doc.data();
                totalProducts++;
                
                if (product.status === 'sold') {
                    // Calculate revenue from sold products
                    productsSold++;
                    totalRevenue += product.winningBid || product.currentBid || product.minimumBid || 0;
                    
                    // Calculate quantity sold (extract number from quantity string)
                    const qty = parseFloat(product.quantity) || 0;
                    totalQuantitySold += qty;
                } else {
                    // Check if bidding is still active
                    const startTime = product.biddingStartTime?.toDate();
                    if (startTime) {
                        const durationMs = (product.biddingDuration || 60) * 60 * 1000;
                        const endTime = new Date(startTime.getTime() + durationMs);
                        if (now < endTime) {
                            activeListings++;
                        }
                    }
                }
            });

            // Get total bids on farmer's products
            return db.collection('bids')
                .get();
        })
        .then(bidsSnapshot => {
            // Count bids for this farmer's products
            // First get list of farmer's product IDs
            return db.collection('products')
                .where('farmerId', '==', farmerId)
                .get()
                .then(productsSnapshot => {
                    const farmerProductIds = productsSnapshot.docs.map(doc => doc.id);
                    
                    bidsSnapshot.forEach(doc => {
                        const bid = doc.data();
                        if (farmerProductIds.includes(bid.productId)) {
                            totalBids++;
                        }
                    });
                    
                    // Update UI with analytics
                    updateAnalyticsUI(totalRevenue, productsSold, activeListings, totalBids, totalQuantitySold, totalProducts);
                });
        })
        .catch(err => {
            console.error('Error loading analytics:', err);
        });
}

// Update analytics UI
function updateAnalyticsUI(revenue, sold, active, bids, quantity, total) {
    // Format revenue with Indian number format
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `₹${formatIndianCurrency(revenue)}`;
    }
    
    if (productsSoldElement) {
        productsSoldElement.textContent = sold;
    }
    
    if (activeListingsElement) {
        activeListingsElement.textContent = active;
    }
    
    if (totalBidsElement) {
        totalBidsElement.textContent = bids;
    }
    
    // Calculate and display average sale price
    if (avgSalePriceElement) {
        const avgPrice = sold > 0 ? Math.round(revenue / sold) : 0;
        avgSalePriceElement.textContent = `₹${formatIndianCurrency(avgPrice)}`;
    }
    
    // Display total quantity sold
    if (totalQuantityElement) {
        totalQuantityElement.textContent = `${quantity} kg`;
    }
    
    // Calculate and display conversion rate
    if (conversionRateElement) {
        const rate = total > 0 ? Math.round((sold / total) * 100) : 0;
        conversionRateElement.textContent = `${rate}%`;
    }
}

// Format number to Indian currency format (e.g., 1,00,000)
function formatIndianCurrency(num) {
    if (num === 0) return '0';
    
    const numStr = num.toString();
    let result = '';
    let count = 0;
    
    // Handle decimal part if any
    const parts = numStr.split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    
    for (let i = intPart.length - 1; i >= 0; i--) {
        count++;
        result = intPart[i] + result;
        
        if (count === 3 && i !== 0) {
            result = ',' + result;
            count = 0;
        } else if (count === 2 && intPart.length > 3 && i !== 0 && intPart.length - i > 3) {
            result = ',' + result;
            count = 0;
        }
    }
    
    // Simple comma formatting for larger numbers
    result = num.toLocaleString('en-IN');
    
    return result;
}
