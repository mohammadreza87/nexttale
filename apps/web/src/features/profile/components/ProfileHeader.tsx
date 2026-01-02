import {
  Crown,
  User,
  Menu,
  X,
  Edit2,
  Volume2,
  VolumeX,
  LogOut,
} from 'lucide-react';
import type { UserSubscription } from '../../../lib/subscriptionService';
import { getSafeDisplayName } from '../../../lib/displayName';

interface UserProfile {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface ProfileHeaderProps {
  profile: UserProfile | null;
  userEmail?: string;
  userFullName?: string;
  subscription: UserSubscription | null;
  isPro: boolean;
  followersCount: number;
  followingCount: number;
  autoNarrationEnabled: boolean;
  showProfileMenu: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEditProfile: () => void;
  onToggleAutoNarration: () => void;
  onManageSubscription: () => void;
  onShowUpgrade: () => void;
  onSignOut: () => void;
}

export function ProfileHeader({
  profile,
  userEmail,
  userFullName,
  subscription,
  isPro,
  followersCount,
  followingCount,
  autoNarrationEnabled,
  showProfileMenu,
  onToggleMenu,
  onCloseMenu,
  onEditProfile,
  onToggleAutoNarration,
  onManageSubscription,
  onShowUpgrade,
  onSignOut,
}: ProfileHeaderProps) {
  return (
    <div
      className={`relative mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl ${isPro ? 'pt-12' : ''}`}
    >
      {isPro && (
        <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-purple-600 to-pink-600">
          <Crown className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white">PRO</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        {/* Profile Picture */}
        <div
          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${profile?.avatar_url ? '' : 'bg-gray-800'}`}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-500" />
          )}
        </div>

        {/* Profile Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-white">
                {getSafeDisplayName(
                  profile?.display_name || userFullName || userEmail || '',
                  'User'
                )}
              </h1>
            </div>
            {/* Hamburger Menu */}
            <div className="relative">
              <button
                onClick={onToggleMenu}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800"
              >
                {showProfileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={onCloseMenu}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-gray-700 bg-gray-800 py-2 shadow-xl">
                    {/* Subscription Info - Clickable */}
                    {subscription && (
                      <button
                        onClick={() => {
                          if (
                            subscription.subscription_tier === 'pro' &&
                            subscription.stripe_customer_id &&
                            !subscription.is_grandfathered
                          ) {
                            onManageSubscription();
                          } else if (
                            subscription.subscription_tier !== 'pro' &&
                            !subscription.is_grandfathered
                          ) {
                            onShowUpgrade();
                          }
                          onCloseMenu();
                        }}
                        className="w-full border-b border-gray-700 px-3 py-2 text-left hover:bg-gray-700"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-gray-400">Subscription</span>
                          {subscription.subscription_tier === 'pro' ||
                          subscription.is_grandfathered ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-purple-400">
                              <Crown className="h-3 w-3" />
                              Pro {subscription.is_grandfathered && '(Lifetime)'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Free</span>
                          )}
                        </div>
                        {subscription.subscription_tier === 'pro' ||
                        subscription.is_grandfathered ? (
                          <p className="text-[10px] text-gray-500">
                            Unlimited stories{' '}
                            {!subscription.is_grandfathered &&
                              subscription.stripe_customer_id &&
                              '• Tap to manage'}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-500">Tap to upgrade</p>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onEditProfile();
                        onCloseMenu();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {autoNarrationEnabled ? (
                          <Volume2 className="h-3.5 w-3.5" />
                        ) : (
                          <VolumeX className="h-3.5 w-3.5" />
                        )}
                        <span>Auto Narration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {autoNarrationEnabled ? 'On' : 'Off'}
                        </span>
                        <button
                          type="button"
                          onClick={onToggleAutoNarration}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoNarrationEnabled
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                              autoNarrationEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 border-t border-gray-700 pt-1">
                      <a
                        href="/terms"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700"
                        onClick={onCloseMenu}
                      >
                        <span>Terms of Service</span>
                      </a>
                      <a
                        href="/privacy"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700"
                        onClick={onCloseMenu}
                      >
                        <span>Privacy Policy</span>
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut();
                        onCloseMenu();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-left">
              <p className="text-sm font-bold text-white">{followersCount}</p>
              <p className="text-[10px] text-gray-500">Followers</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">{followingCount}</p>
              <p className="text-[10px] text-gray-500">Following</p>
            </div>
          </div>
        </div>
      </div>

      {profile?.bio && <p className="mt-4 break-words text-sm text-gray-300">{profile.bio}</p>}
    </div>
  );
}
