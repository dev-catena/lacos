import { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import authService from '../services/authService';

export const useSupplier = () => {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const data = await supplierService.getMySupplier();
        if (data.success && data.supplier) {
          setSupplier(data.supplier);
          setIsApproved(data.supplier.status === 'approved');
        } else {
          setSupplier(null);
          setIsApproved(false);
        }
      } catch (error) {
        // Se não encontrar fornecedor, não é erro - usuário simplesmente não é fornecedor
        setSupplier(null);
        setIsApproved(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, []);

  return { supplier, loading, isApproved };
};



