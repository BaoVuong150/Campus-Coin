/** DTO cho khu vực quản trị – không bao giờ chứa password, token hay thông tin xác thực. */
export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  isActive: boolean;
  academicYear: string | null;
  transactionCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminOverviewDTO {
  totals: {
    users: number;
    activeUsers: number;
    newUsersThisMonth: number;
    transactions: number;
    transactionsThisMonth: number;
    volumeThisMonth: number;
  };
  userGrowth: { key: string; label: string; newUsers: number; totalUsers: number }[];
  transactionVolume: { key: string; label: string; count: number; volume: number }[];
  categoryDistribution: { name: string; amount: number; percentage: number; color: string | null }[];
  recentUsers: AdminUserDTO[];
}
