// Sample data - Lojas locais mantidas
        let stores = [
            { id: 1, name: "Messi Sports", description: "Loja oficial de produtos esportivos do Messi", category: "Esportes", address: "Av. Paulista, 1000 - São Paulo, SP", image: "https://imagens.ebc.com.br/gnI4BvUvr_DaNi1UYumXCW4N1fU=/1170x700/smart/https://agenciabrasil.ebc.com.br/sites/default/files/thumbnails/image/2020-09-04t074743z_1244062587_rc2jri9dq6xt_rtrmadp_3_soccer-spain-advertisaing.jpg?itok=z64e34Yz", ownerId: 1 },
            { id: 2, name: "Ney Store", description: "Tudo para o seu futebol", category: "Equipamentos", address: "Rua Augusta, 500 - São Paulo, SP", image: "https://img.nsctotal.com.br/wp-content/uploads/2025/01/Nova-chuteira-Neymar-20.jpg", ownerId: 2 },
            { id: 3, name: "Camisas & Cia", description: "As melhores camisas de times", category: "Vestuário", address: "Shopping Ibirapuera, Loja 25 - São Paulo, SP", image: "https://cf.shopee.com.br/file/a259a4af53de041261867bff64a06003", ownerId: 3 },
            { id: 4, name: "Mbappe Acessórios", description: "Acessórios para torcedores e jogadores", category: "Acessórios", address: "Rua Oscar Freire, 200 - São Paulo, SP", image: "https://s2-oglobo.glbimg.com/HxwMb-91ISfn8kRZdDdamryUC4E=/0x0:421x440/888x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2024/B/I/wL8SAUQgyQqDMEdF3nNw/mbappe2.png", ownerId: 4 }
        ];

        // Array de produtos começa vazio e é preenchido pela API Externa
        let products = [];
        let editingProductId = null;

        // User and cart data
        let currentUser = null;
        let userType = 'customer';
        let cart = [];
        let orders = [];
        let sellerProducts = [];
        let currentStoreId = null;

        // ==========================================
        // CONSUMO DE API EXTERNA (MERCADO LIVRE)
        // ==========================================
        async function carregarProdutosMercadoLivre() {
            try {
                // Busca produtos reais da categoria 'futebol' na API do Mercado Livre
                const response = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=futebol&limit=12');
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Mapeia os dados da API para a estrutura utilizada na sua aplicação
                    products = data.results.map((item, index) => ({
                        id: item.id || index + 1,
                        storeId: (index % stores.length) + 1, // Distribui entre as lojas ativas
                        name: item.title,
                        price: item.price,
                        description: "Produto obtido em tempo real via API pública do Mercado Livre.",
                        category: "Futebol",
                        quantity: item.available_quantity || 10,
                        image: item.thumbnail.replace('I.jpg', 'O.jpg') // Converte para imagem em alta resolução
                    }));

                    // Atualiza a interface
                    renderProducts();
                    renderFeaturedProducts();
                }
            } catch (error) {
                console.error('Erro ao buscar produtos da API externa:', error);
            }
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function () {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try { currentUser = JSON.parse(savedUser); } catch { localStorage.removeItem('currentUser'); }
                if (currentUser) {
                userType = currentUser.type;
                showApp();
                }
            }

            // Busca produtos da API externa assim que a página carrega
            carregarProdutosMercadoLivre();

            renderStores();
            updateCartCount();
            populateStoreFilter();

            if (!currentUser) showPage('login-page');
        });

        // User type selection
        function selectUserType(type) {
            userType = type;
            document.querySelectorAll('.user-type').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelector(`.user-type[data-type="${type}"]`).classList.add('active');
        }

        // Login function
        function login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            currentUser = {
                id: 1,
                name: email.split('@')[0],
                email: email,
                type: userType
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        }

        // Show the main application
        function showApp() {
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('app').style.display = 'block';

            document.getElementById('seller-nav').style.display = userType === 'seller' ? 'block' : 'none';
            if (userType === 'seller') {
                document.getElementById('seller-nav').style.display = 'block';
                checkSellerStore();
            }

            showPage('home');
        }

        // Check if seller has a store registered
        function checkSellerStore() {
            const userStore = stores.find(store => store.ownerId === currentUser.id);

            if (userStore) {
                document.getElementById('productManagementSection').style.display = 'block';
                document.getElementById('myProductsSection').style.display = 'block';
                document.getElementById('myStoreProductsSection').style.display = 'block';
                document.getElementById('storeRegistrationSection').style.display = 'none';

                currentStoreId = userStore.id;
                renderSellerProducts();
                renderMyStoreProducts();
            } else {
                document.getElementById('productManagementSection').style.display = 'none';
                document.getElementById('myProductsSection').style.display = 'none';
                document.getElementById('myStoreProductsSection').style.display = 'none';
                document.getElementById('storeRegistrationSection').style.display = 'block';
            }
        }

        // Register store function
        function registerStore() {
            const name = document.getElementById('storeName').value;
            const category = document.getElementById('storeCategory').value;
            const description = document.getElementById('storeDescription').value;
            const address = document.getElementById('storeAddress').value;
            const image = document.getElementById('storeImage').value;

            if (!name || !category || !description || !address || !image) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            const newStore = {
                id: stores.length + 1,
                name: name,
                description: description,
                category: category,
                address: address,
                image: image,
                ownerId: currentUser.id
            };

            stores.push(newStore);
            currentStoreId = newStore.id;

            document.getElementById('productManagementSection').style.display = 'block';
            document.getElementById('myProductsSection').style.display = 'block';
            document.getElementById('myStoreProductsSection').style.display = 'block';
            document.getElementById('storeRegistrationSection').style.display = 'none';

            document.getElementById('storeName').value = '';
            document.getElementById('storeDescription').value = '';
            document.getElementById('storeAddress').value = '';
            document.getElementById('storeImage').value = '';

            showNotification('Loja cadastrada com sucesso!');
        }

        // Logout function
        function logout() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('app').style.display = 'none';
            document.getElementById('login-page').style.display = 'block';
        }

        // Page navigation
        function showPage(pageId) {
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.style.display = 'none';
            });

            const target = document.getElementById(pageId);
            if (!target) return;
            target.style.display = 'block';

            if (pageId === 'cart') {
                renderCart();
            } else if (pageId === 'orders') {
                renderOrders();
            } else if (pageId === 'seller') {
                checkSellerStore();
            } else if (pageId === 'stores') {
                renderStores();
            } else if (pageId === 'products') {
                renderProducts();
            } else if (pageId === 'home') {
                renderFeaturedStores();
                renderFeaturedProducts();
            }
        }

        // Store rendering
        function renderStores() {
            const storesList = document.getElementById('storesList');
            storesList.innerHTML = '';

            stores.forEach(store => {
                const storeCard = document.createElement('div');
                storeCard.className = 'store-card';
                storeCard.onclick = () => showStoreProducts(store.id);
                storeCard.innerHTML = `
                    <div class="store-image">
                        <img src="${store.image}" alt="${store.name}">
                    </div>
                    <div class="store-info">
                        <div class="store-title">${store.name}</div>
                        <div class="store-description">${store.description}</div>
                        <div class="store-address">${store.address}</div>
                        <div class="store-category">Categoria: ${store.category}</div>
                    </div>
                `;
                storesList.appendChild(storeCard);
            });
        }

        function renderFeaturedStores() {
            const featuredStores = document.getElementById('featuredStores');
            featuredStores.innerHTML = '';

            stores.slice(0, 4).forEach(store => {
                const storeCard = document.createElement('div');
                storeCard.className = 'store-card';
                storeCard.onclick = () => showStoreProducts(store.id);
                storeCard.innerHTML = `
                    <div class="store-image">
                        <img src="${store.image}" alt="${store.name}">
                    </div>
                    <div class="store-info">
                        <div class="store-title">${store.name}</div>
                        <div class="store-description">${store.description}</div>
                        <div class="store-address">${store.address}</div>
                        <div class="store-category">Categoria: ${store.category}</div>
                    </div>
                `;
                featuredStores.appendChild(storeCard);
            });
        }

        // Show store products
        function showStoreProducts(storeId) {
            const store = stores.find(s => s.id === storeId);
            if (!store) return;

            currentStoreId = storeId;

            const storeHeader = document.getElementById('storeHeader');
            storeHeader.innerHTML = `
                <div class="store-logo">
                    <img src="${store.image}" alt="${store.name}">
                </div>
                <div class="store-details">
                    <h2>${store.name}</h2>
                    <p>${store.description}</p>
                    <p><strong>Endereço:</strong> ${store.address}</p>
                    <p><strong>Categoria:</strong> ${store.category}</p>
                </div>
            `;

            const storeProductsList = document.getElementById('storeProductsList');
            storeProductsList.innerHTML = '';

            const storeProducts = products.filter(product => product.storeId === storeId);

            if (storeProducts.length === 0) {
                storeProductsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Esta loja ainda não possui produtos cadastrados.</p>';
                showPage('store-products');
                return;
            }

            storeProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <button class="btn btn-block" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                    </div>
                `;
                storeProductsList.appendChild(productCard);
            });

            showPage('store-products');
        }

        function goBackToStores() {
            showPage('stores');
        }

        // Product rendering
        function renderProducts() {
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '';

            if (products.length === 0) {
                productsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Carregando produtos reais da API...</p>';
                return;
            }

            products.forEach(product => {
                const store = stores.find(s => s.id === product.storeId);
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-store">Loja: ${store ? store.name : 'Desconhecida'}</div>
                        <button class="btn btn-block" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                    </div>
                `;
                productsList.appendChild(productCard);
            });
        }

        function renderFeaturedProducts() {
            const featuredProducts = document.getElementById('featuredProducts');
            featuredProducts.innerHTML = '';

            products.slice(0, 6).forEach(product => {
                const store = stores.find(s => s.id === product.storeId);
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-store">Loja: ${store ? store.name : 'Desconhecida'}</div>
                        <button class="btn btn-block" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                    </div>
                `;
                featuredProducts.appendChild(productCard);
            });
        }

        function renderSellerProducts() {
            const sellerProductsList = document.getElementById('sellerProducts');
            sellerProductsList.innerHTML = '';

            if (sellerProducts.length === 0) {
                sellerProductsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Você ainda não adicionou nenhum produto</p>';
                return;
            }

            sellerProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-category">Categoria: ${product.category}</div>
                        <button class="btn btn-block" style="margin-top: 0.5rem;" onclick="editProduct('${product.id}')">Editar</button>
                        <button class="btn" style="background-color: var(--danger-color); margin-top: 0.5rem; width: 100%;" onclick="deleteProduct('${product.id}')">Excluir</button>
                    </div>
                `;
                sellerProductsList.appendChild(productCard);
            });
        }

        function renderMyStoreProducts() {
            const myStoreProductsList = document.getElementById('myStoreProducts');
            myStoreProductsList.innerHTML = '';

            const myStoreProducts = products.filter(product => product.storeId === currentStoreId);

            if (myStoreProducts.length === 0) {
                myStoreProductsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Sua loja ainda não possui produtos cadastrados.</p>';
                return;
            }

            myStoreProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-category">Categoria: ${product.category}</div>
                    </div>
                `;
                myStoreProductsList.appendChild(productCard);
            });
        }

        // Add product function for sellers
        function addProduct() {
            const name = document.getElementById('productName').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const category = document.getElementById('productCategory').value;
            const quantity = parseInt(document.getElementById('productQuantity').value);
            const description = document.getElementById('productDescription').value;
            const image = document.getElementById('productImage').value;

            if (!name.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 0 || !description.trim() || !image) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            const newProduct = {
                id: editingProductId || crypto.randomUUID(),
                storeId: currentStoreId,
                name: name,
                price: price,
                category: category,
                quantity: quantity,
                description: description,
                image: image
            };

            if (editingProductId) {
                products = products.filter(p => p.id !== editingProductId);
                sellerProducts = sellerProducts.filter(p => p.id !== editingProductId);
            }
            editingProductId = null;
            sellerProducts.push(newProduct);
            products.unshift(newProduct);

            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productQuantity').value = '';
            document.getElementById('productDescription').value = '';
            document.getElementById('productImage').value = '';

            renderSellerProducts();
            renderMyStoreProducts();
            renderProducts();
            showNotification('Produto adicionado com sucesso!');
        }

        function editProduct(productId) {
            const product = sellerProducts.find(p => p.id === productId);
            if (!product) return;

            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productQuantity').value = product.quantity;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productImage').value = product.image;

            editingProductId = productId;
            showNotification('Produto carregado para edição.');
        }

        function deleteProduct(productId, showAlert = true) {
            sellerProducts = sellerProducts.filter(p => p.id !== productId);
            products = products.filter(p => p.id !== productId);

            renderSellerProducts();
            renderMyStoreProducts();
            renderProducts();

            if (showAlert) {
                showNotification('Produto excluído com sucesso!');
            }
        }

        // Search and filter functions
        function searchStores() {
            const searchTerm = document.getElementById('storeSearch').value.toLowerCase();
            const storesList = document.getElementById('storesList');
            storesList.innerHTML = '';

            const filteredStores = stores.filter(store =>
                store.name.toLowerCase().includes(searchTerm) ||
                store.description.toLowerCase().includes(searchTerm)
            );

            if (filteredStores.length === 0) {
                storesList.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhuma loja encontrada</p>';
                return;
            }

            filteredStores.forEach(store => {
                const storeCard = document.createElement('div');
                storeCard.className = 'store-card';
                storeCard.onclick = () => showStoreProducts(store.id);
                storeCard.innerHTML = `
                    <div class="store-image">
                        <img src="${store.image}" alt="${store.name}">
                    </div>
                    <div class="store-info">
                        <div class="store-title">${store.name}</div>
                        <div class="store-description">${store.description}</div>
                        <div class="store-address">${store.address}</div>
                        <div class="store-category">Categoria: ${store.category}</div>
                    </div>
                `;
                storesList.appendChild(storeCard);
            });
        }

        function filterStores() {
            const category = document.getElementById('storeCategoryFilter').value;
            const storesList = document.getElementById('storesList');
            storesList.innerHTML = '';

            const filteredStores = category ?
                stores.filter(store => store.category === category) :
                stores;

            if (filteredStores.length === 0) {
                storesList.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhuma loja encontrada</p>';
                return;
            }

            filteredStores.forEach(store => {
                const storeCard = document.createElement('div');
                storeCard.className = 'store-card';
                storeCard.onclick = () => showStoreProducts(store.id);
                storeCard.innerHTML = `
                    <div class="store-image">
                        <img src="${store.image}" alt="${store.name}">
                    </div>
                    <div class="store-info">
                        <div class="store-title">${store.name}</div>
                        <div class="store-description">${store.description}</div>
                        <div class="store-address">${store.address}</div>
                        <div class="store-category">Categoria: ${store.category}</div>
                    </div>
                `;
                storesList.appendChild(storeCard);
            });
        }

        function searchProducts() {
            const searchTerm = document.getElementById('productSearch').value.toLowerCase();
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '';

            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );

            if (filteredProducts.length === 0) {
                productsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhum produto encontrado</p>';
                return;
            }

            filteredProducts.forEach(product => {
                const store = stores.find(s => s.id === product.storeId);
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-store">Loja: ${store ? store.name : 'Desconhecida'}</div>
                        <button class="btn btn-block" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                    </div>
                `;
                productsList.appendChild(productCard);
            });
        }

        function filterProducts() {
            const category = document.getElementById('productCategoryFilter').value;
            const storeId = document.getElementById('productStore').value;
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '';

            let filteredProducts = products;

            if (category) {
                filteredProducts = filteredProducts.filter(product => product.category === category);
            }

            if (storeId) {
                filteredProducts = filteredProducts.filter(product => product.storeId == storeId);
            }

            if (filteredProducts.length === 0) {
                productsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhum produto encontrado</p>';
                return;
            }

            filteredProducts.forEach(product => {
                const store = stores.find(s => s.id === product.storeId);
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-title">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-quantity">Disponível: ${product.quantity}</div>
                        <div class="product-store">Loja: ${store ? store.name : 'Desconhecida'}</div>
                        <button class="btn btn-block" onclick="addToCart('${product.id}')">Adicionar ao Carrinho</button>
                    </div>
                `;
                productsList.appendChild(productCard);
            });
        }

        function populateStoreFilter() {
            const storeFilter = document.getElementById('productStore');
            storeFilter.innerHTML = '<option value="">Todas as lojas</option>';

            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.name;
                storeFilter.appendChild(option);
            });
        }

        // Cart functionality
        function addToCart(productId) {
            const product = products.find(p => p.id == productId);
            if (!product || product.quantity < 1) return;

            const existingItem = cart.find(item => item.id == productId);

            if (existingItem) {
                if (existingItem.quantity >= product.quantity) {
                    alert('Quantidade máxima disponível atingida!');
                    return;
                }
                existingItem.quantity++;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }

            updateCartCount();
            showNotification(`${product.name} adicionado ao carrinho!`);
        }

        function updateCartCount() {
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cartCount').textContent = count;
        }

        function renderCart() {
            const cartItems = document.getElementById('cartItems');
            cartItems.innerHTML = '';

            if (cart.length === 0) {
                cartItems.innerHTML = '<p style="text-align: center; padding: 2rem;">Seu carrinho está vazio</p>';
                document.getElementById('cartSubtotal').textContent = 'R$ 0,00';
                document.getElementById('cartShipping').textContent = 'R$ 0,00';
                document.getElementById('cartTotal').textContent = 'R$ 0,00';
                return;
            }

            let subtotal = 0;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;

                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', parseInt(this.value))">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            <button style="margin-left: 1rem; color: var(--danger-color); background: none; border: none; cursor: pointer;" onclick="removeFromCart('${item.id}')">Remover</button>
                        </div>
                    </div>
                    <div style="font-weight: bold;">R$ ${itemTotal.toFixed(2)}</div>
                `;
                cartItems.appendChild(cartItem);
            });

            const shipping = subtotal > 200 ? 0 : 15.90;
            const total = subtotal + shipping;

            document.getElementById('cartSubtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
            document.getElementById('cartShipping').textContent = `R$ ${shipping.toFixed(2)}`;
            document.getElementById('cartTotal').textContent = `R$ ${total.toFixed(2)}`;
        }

        function updateQuantity(productId, newQuantity) {
            if (!Number.isInteger(newQuantity) || newQuantity < 1) return;

            const product = products.find(p => p.id == productId);
            if (product && newQuantity > product.quantity) {
                alert('Quantidade máxima disponível atingida!');
                return;
            }

            const item = cart.find(item => item.id == productId);
            if (item) {
                item.quantity = newQuantity;
                renderCart();
                updateCartCount();
            }
        }

        function removeFromCart(productId) {
            cart = cart.filter(item => item.id != productId);
            renderCart();
            updateCartCount();
        }

        // Checkout and orders
        function placeOrder() {
            if (cart.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }

            const order = {
                id: orders.length + 1,
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                items: [...cart],
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 200 ? 0 : 15.90)
            };

            orders.push(order);
            cart = [];
            updateCartCount();

            showPage('orders');
            showNotification('Pedido realizado com sucesso!');
        }

        function renderOrders() {
            const ordersList = document.getElementById('ordersList');

            if (orders.length === 0) {
                ordersList.innerHTML = '<p style="text-align: center; padding: 2rem;">Você ainda não fez nenhum pedido</p>';
                return;
            }

            ordersList.innerHTML = '';

            orders.forEach(order => {
                let statusText = 'Pendente';
                let statusClass = 'status-pending';

                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.innerHTML = `
                    <div class="order-header">
                        <div>
                            <strong>Pedido #${order.id}</strong>
                            <div>Data: ${order.date}</div>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div class="order-item-name">${item.name}</div>
                                <div class="order-item-quantity">Qtd: ${item.quantity}</div>
                                <div>R$ ${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">Total: R$ ${order.total.toFixed(2)}</div>
                `;
                ordersList.appendChild(orderCard);
            });
        }

        // Messi Chat functionality
        function toggleChat() {
            const chat = document.getElementById('messiChat');
            chat.classList.toggle('active');
        }

        function handleChatInput(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();

            if (!message) return;

            const messagesContainer = document.getElementById('chatMessages');

            const userMessage = document.createElement('div');
            userMessage.className = 'chat-message message-user';
            userMessage.textContent = message;
            messagesContainer.appendChild(userMessage);

            input.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            setTimeout(() => {
                const botResponse = getBotResponse(message);
                const botMessage = document.createElement('div');
                botMessage.className = 'chat-message message-bot';
                botMessage.textContent = botResponse;
                messagesContainer.appendChild(botMessage);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 1000);
        }

        function getBotResponse(message) {
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('ola')) {
                return 'Olá! Sou o Messi, como posso ajudar você hoje?';
            } else if (lowerMessage.includes('produto') || lowerMessage.includes('comprar')) {
                return 'Temos uma variedade de produtos de futebol de alta qualidade. Você pode ver nosso catálogo na página de produtos!';
            } else if (lowerMessage.includes('carrinho') || lowerMessage.includes('compras')) {
                return 'Você pode ver e gerenciar seus itens no carrinho de compras. Lá você pode finalizar seu pedido também!';
            } else if (lowerMessage.includes('obrigado') || lowerMessage.includes('obrigada')) {
                return 'De nada! Estou aqui para ajudar. Se tiver mais alguma dúvida, é só perguntar!';
            } else {
                return 'Desculpe, não entendi sua pergunta. Posso ajudar com informações sobre produtos, lojas, carrinho, pedidos ou pagamentos.';
            }
        }

        // Utility functions
        function showNotification(message) {
            alert(message);
        }