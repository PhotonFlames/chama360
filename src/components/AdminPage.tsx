import React from 'react';
import { User, Role } from '../types';
import { Users, Shield, Settings, Activity, Database } from 'lucide-react';

interface AdminPageProps {
  users: User[];
}

export default function AdminPage({ users }: AdminPageProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Admin Control Center</h3>
          <p className="text-sm text-zinc-400">System-wide settings and administrative controls</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard 
          title="System Health" 
          status="Operational" 
          icon={<Activity className="text-emerald-500" />} 
        />
        <AdminCard 
          title="System Storage" 
          status="Active" 
          icon={<Database className="text-blue-500" />} 
        />
        <AdminCard 
          title="Security Level" 
          status="High" 
          icon={<Shield className="text-purple-500" />} 
        />
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h4 className="font-bold text-white">System Logs</h4>
        </div>
        <div className="divide-y divide-white/5">
          <LogItem action="User Login" user="photon973@gmail.com" time="2 mins ago" />
          <LogItem action="Loan Approval" user="Treasurer" time="1 hour ago" />
          <LogItem action="Settings Updated" user="photon973@gmail.com" time="3 hours ago" />
          <LogItem action="New Member Registered" user="Admin" time="5 hours ago" />
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
        <h4 className="font-bold text-white mb-4">Global Settings</h4>
        <div className="space-y-4">
          <SettingToggle label="Enable Automated Penalties" defaultChecked={true} />
          <SettingToggle label="Allow Member Loan Requests" defaultChecked={true} />
          <SettingToggle label="Public Financial Transparency" defaultChecked={true} />
        </div>
      </div>
    </div>
  );
}

function AdminCard({ title, status, icon }: { title: string; status: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h5 className="text-sm font-medium text-zinc-400">{title}</h5>
      </div>
      <p className="text-xl font-bold text-white">{status}</p>
    </div>
  );
}

function LogItem({ action, user, time }: { action: string; user: string; time: string }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between text-sm">
      <div>
        <span className="text-white font-medium">{action}</span>
        <span className="text-zinc-500 mx-2">by</span>
        <span className="text-emerald-400">{user}</span>
      </div>
      <span className="text-zinc-500">{time}</span>
    </div>
  );
}

function SettingToggle({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <button className={`w-10 h-5 rounded-full transition-colors relative ${defaultChecked ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${defaultChecked ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}
