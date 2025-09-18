'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, Home, TrendingDown, Search, Calendar, DollarSign, Star, Clock, AlertCircle } from 'lucide-react';
import { buyerApi } from '@/api/buyer';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  data?: {
    propertyId?: string;
    priceChange?: {
      oldPrice: number;
      newPrice: number;
      changeAmount: number;
      changePercentage: number;
    };
    actionUrl?: string;
  };
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function NotificationsPanel({
  notifications,
  onClose,
  onRefresh
}: NotificationsPanelProps) {
  const [loading, setLoading] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_match':
        return <Home className="w-5 h-5 text-blue-500" />;
      case 'price_change':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'saved_search':
        return <Search className="w-5 h-5 text-green-500" />;
      case 'viewing_reminder':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'offer_update':
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      case 'recommendation':
        return <Star className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      await buyerApi.markNotificationRead(notificationId);
      onRefresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-l-4 ${
                    notification.status === 'unread' 
                      ? getPriorityColor(notification.priority)
                      : 'border-l-gray-300 bg-gray-50'
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => {
                    if (notification.status === 'unread') {
                      handleMarkAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          notification.status === 'unread' ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className={`mt-1 text-sm ${
                        notification.status === 'unread' ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {/* Price Change Details */}
                      {notification.data?.priceChange && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Price Change:</span>
                            <span className={`font-medium ${
                              notification.data.priceChange.changeAmount < 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              ${Math.abs(notification.data.priceChange.changeAmount).toLocaleString()}
                              ({notification.data.priceChange.changePercentage > 0 ? '+' : ''}
                              {notification.data.priceChange.changePercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-400">
                              ${notification.data.priceChange.oldPrice.toLocaleString()} → 
                              ${notification.data.priceChange.newPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Priority Indicator */}
                      {notification.priority === 'urgent' && (
                        <div className="mt-2 flex items-center text-xs text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Urgent
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}