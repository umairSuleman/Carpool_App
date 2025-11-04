import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import WalletService, { Wallet, Transaction } from '../../../services/walletService';
import { useRouter } from 'expo-router';

export default function PaymentsScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const walletResponse = await WalletService.getWallet();
      if (walletResponse.success) {
        setWallet(walletResponse.wallet);
      }

      const transactionsResponse = await WalletService.getTransactions();
      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.transactions);
      }
      setIsGuest(false);
    } catch (error: any) {
      console.error('Failed to load payment data:', error);
      if (error.message.includes('Access denied')) {
        setIsGuest(true);
      } else {
        Alert.alert('Error', 'Failed to load payment data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const formatAmount = (amount: string, type: 'credit' | 'debit') => {
    const value = parseFloat(amount).toFixed(2);
    return type === 'credit' ? `+ ₹${value}` : `- ₹${value}`;
  };

  const getAmountColor = (type: 'credit' | 'debit') => {
    return type === 'credit' ? styles.amountCredit : styles.amountDebit;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.transactionAmount, getAmountColor(item.transaction_type)]}>
        {formatAmount(item.amount, item.transaction_type)}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Please log in</Text>
          <Text style={styles.emptySubtext}>Log in to view your wallet and transactions.</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.signInButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Balance Header */}
      <View style={styles.header}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          ₹{wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
        </Text>
        <TouchableOpacity style={styles.addMoneyButton}>
          <Text style={styles.addMoneyButtonText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Text style={styles.listTitle}>Transaction History</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions</Text>
            <Text style={styles.emptySubtext}>Your recent transactions will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  addMoneyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 15,
  },
  addMoneyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountCredit: {
    color: '#34C759', // Green
  },
  amountDebit: {
    color: '#FF3B30', // Red
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});