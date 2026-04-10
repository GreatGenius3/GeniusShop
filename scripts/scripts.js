// Funktion för att hämta produkter med fallback
// Använder fakestoreapi.com först, vid fel provar dummyjson.com
async function fetchProducts() {
    let apiSource = ''; // Lokal variabel för att spara API-källa

    try {
        // Försök först med fakestoreapi.com
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Fortsätt att ladda artiklar om hämtningen lyckades
        apiSource = 'fakestoreapi';
        const products = await response.json();
        displayProducts(products, apiSource);
        console.log('Produkter hämtade från fakestoreapi.com');
    }
    catch (error) {
        console.warn('Kunde inte hämta från fakestoreapi.com, försöker dummyjson.com:', error.message);
        try {
            // Skulle nu laddningen till https://fakestoreapi.com/products misslyckas sأ¥ provar
            // Vi ett annat alternativ
            // Fallback till dummyjson.com
            const response = await fetch('https://dummyjson.com/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            apiSource = 'dummyjson';
            const data = await response.json();
            displayProducts(data.products, apiSource); // dummyjson returnerar {products: [...]}
            console.log('Produkter hämtade från dummyjson.com');
        }
        catch (fallbackError) {
            console.error('Kunde inte hämta produkter från någon källa:', fallbackError);
            // Visa felmeddelande för användaren
            const productList = document.querySelector('.product-list');
            if (productList) {
                productList.innerHTML = '<div class="col-12"><div class="alert alert-danger">Kunde inte ladda produkter just nu. Försök igen senare.</div></div>';
            }
        }
    }
}

// Funktion för att visa produkter på sidan
function displayProducts(products, apiSource)
{
    // vi kollar först om sektionen finns på sidan innan vi försöker lägga in produkter
    const productList = document.querySelector('.product-list');
    if (!productList)
        return;

    productList.innerHTML = ''; // Töm den befintliga listan
    productList.classList.add('row');

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 mb-4';

        const productDiv = document.createElement('div');
        productDiv.className = 'product card h-100 shadow-sm';

        // Välj rätt bild-fält beroende på API-källa
        const imageUrl = apiSource === 'dummyjson' ? product.thumbnail : product.image;

        productDiv.innerHTML = `
            <img class="card-img-top product-image" src="${imageUrl}" alt="${product.title}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text text-success fw-bold">$${product.price}</p>
                <button class="btn btn-primary mt-auto" onclick="addToCart(${product.id}, '${product.title}', ${product.price}, '${imageUrl}')">Lägg till vara</button>
            </div>
        `;

        // Lägg till produktens information i columnen (col)
        col.appendChild(productDiv);
        // Visa nu den inlagda produkten på sidans fält productList "product-list"
        productList.appendChild(col);
    });
}

// Varukorgsfunktioner
// Hämtar kundvagnen (objektet cart) från den lokala webbläsarens kontainer
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Sparar kundvagnen (objektet cart) till den lokala webbläsarens kontainer
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon(); // Uppdatera menyn ovan med antalet produkter i varukorgen
}

// Lägger till en produkt i varukorgen,
// Först hämtar den den existerande varukorgen (cart) från kontainern
function addToCart(id, title, price, image) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === id); // Hittar en existerande produkt i varukorgen

    // Finns produkten i varukorgen, öka antalet
    if (existingItem) {
        existingItem.quantity += 1;
        // Annars lägger vi en ny titel i varukorgen
    } else {
        cart.push({ id, title, price, image, quantity: 1 });
    }

    // Spara sedan till cart
    saveCart(cart);
    showCartNotification('Produkten har lagts till i varukorgen!');
}

// Funktion som tar bort en produkt från varukorgen
function removeFromCart(id) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== id);
    saveCart(updatedCart);
}

// Uppdatera antalet produkter i varukorgen
function updateQuantity(id, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === id);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(id);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
}

// Tar fram totala summan från varukorgen
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Tar fram antalet produkter i varukorgen
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Funktion för att visa notis om produkt har lagts till i varukorgen
// Visas i 3 sekunder
function showCartNotification(message) {
    // Skapa en tillfällig notis
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    notification.style.zIndex = '9999';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Funktion för att uppdatera saldot på antalet varor på menyn
function updateCartIcon() {
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');

    // Vi hämtar id från menybaren ovanpå sidan
    // cart-icon är identifierat på den delen "Varukorg" i menybaren
    // cart-count är identifierat på den delen "Varukorg" i menybaren
    if (cartIcon && cartCount) {
        const count = getCartItemCount(); // Hämtar antal produkter i varukorgen
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// Funktion för att gå direkt till beställning (behålls för bakåtkompatibilitet)
// Används inte just nu
function orderDirectly(id, title, price, image) {
    const product = { id, title, price, image };
    localStorage.setItem("valdProdukt", JSON.stringify(product));
    window.location.href = 'order.html';
}

// Här sätter vi knappen "Bekräfta köp" till följande funktion
const form = document.querySelector("form");
if (form) {
    // Vi lägger till en event listener på formuläret som lyssnar på submit-eventet
    document.querySelector("form").addEventListener("submit", function (e) {

        e.preventDefault();
        if (validateAll()) {
            alert(`Tack för din beställning har tagits emot! Vi behandlar din order så snart som möjligt.`);

            // Rensa hela varukorgen
            localStorage.removeItem('cart');
            
            // Uppdatera varukorgsikonen
            updateCartIcon();
            
            window.location.href = 'index.html';

        };//If stas för produkten hämtas ifall order formuläret fyllt i korrekt.

    });
}

function validateAll() {
    return (
        validateName() &&
        validateEmail() &&
        validateMobil() &&
        validateStreetAdress() &&
        validatePostNumber() &&
        validateLocality()
    );
}

function validateName() {
    const value = document.getElementById("name").value;
    if (value.length < 2 || value.length > 50) {
        alert("Namnet får enbart vara mellan 2 - 50 tecken.")
        return false;
    }
    return true;
}
function validateEmail() {
    const value = document.getElementById("email").value;
    if (!value.includes("@") || value.length > 50) {
        alert("Eposten ska ha @ och får inte vara mer än 50 tecken.")
        return false;
    }
    return true;
}
function validateMobil() {
    const value = document.getElementById("mobile_number").value;
    const regex = /^[0-9\+\s]+$/;
    if (!regex.test(value) || value.length < 3 || value.length > 20) {
        alert("Telefonnumret får enbart innehålla siffror, mellanslag och ett plustecken.")
        return false;
    }
    return true;
}
function validateStreetAdress() {
    const value = document.getElementById("street_adress").value;
    if (value.length < 2 || value.length > 20) {
        alert("Adressen får enbart vara mellan 2 till 50 tecken.")
        return false;
    }
    return true;
}
function validatePostNumber() {
    const value = document.getElementById("post_number").value;
    const regex = /^[0-9]{5}$/
    if (!regex.test(value)) {
        alert("Post nummer får max vara 5 siffror långa.")
        return false;
    }
    return true;
}
function validateLocality() {
    const value = document.getElementById("locality").value;
    if (value.length < 2 || value.length > 20) {
        alert("Gatuadressen får max vara mellan 2 och 50 karaktärer")
        return false;
    }
    return true;
}

// Funktion för att generera footer vid taggen <footer>
function generateFooter() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = '<div class="container"><p class="m-0 text-center text-white">Copyright &copy; Genius Webbshop 2026</p></div>';
    }
}

// kör funktionen när sidan laddas
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
    generateFooter();
});