import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const product = await api
        .get(`products/${productId}`)
        .then((response) => response.data);

      const productInCartIndex = cart.findIndex(
        (item) => item.id === product.id
      );

      const stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data);

      if (productInCartIndex >= 0) {
        const newCart = cart.map((product) => {
          if (product.id === productId) {
            if (stock.amount >= product.amount + 1) {
              product.amount += 1;
            } else {
              toast.error('Quantidade solicitada fora de estoque');
            }
          }
          return product;
        });
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
      } else {
        if (stock.amount >= 1) {
          setCart([
            ...cart,
            {
              ...product,
              amount: 1,
            },
          ]);
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify([
              ...cart,
              {
                ...product,
                amount: 1,
              },
            ])
          );
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCartIndex = cart.findIndex(
        (item) => item.id === productId
      );
      if (productInCartIndex >= 0) {
        cart.splice(productInCartIndex, 1);
        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
      }else{
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock: Stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data);
        
      if (amount > 0) {
        const newCart = cart.map((product) => {
          if (product.id === productId) {
            if (stock.amount >= amount) {
              product.amount = amount;
            }else{
              toast.error('Quantidade solicitada fora de estoque');
            }
          }
          return product;
        });
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
