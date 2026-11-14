'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useEvaluasiStore } from '@/lib/evaluasi-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { DEV_CATEGORY_LABELS, DEV_CATEGORY_COLORS } from '@/lib/mock-evaluasi';
import { DevCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Star,
  Save,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { useToastStore } from '@/components/ui/toast';

const ASPEK_LIST = [
  { key: 'kehadiran', label: 'Kehadiran', desc: 'Konsistensi hadir dalam pertemuan' },
  { key: 'keaktifan', label: 'Keaktifan', desc: 'Partisipasi aktif selama mentoring' },
  { key: 'pemahaman', label: 'Pemahaman', desc: 'Pemahaman terhadap materi' },
  { key: 'partisipasi', label: 'Partisipasi', desc: 'Keterlibatan dalam kegiatan' },
  { key: 'komitmen', label: 'Komitmen', desc: 'Keseriusan mengikuti program' },
] as const;

const CATEGORIES: { value: DevCategory; label: string; color: string }[] = [
  { value: 'SANGAT_BAIK', label: 'Sangat Baik', color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
  { value: 'BAIK', label: 'Baik', color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' },
  { value: 'CUKUP', label: 'Cukup', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' },
  { value: 'PERLU_PENDAMPINGAN', label: 'Perlu Pendampingan', color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' },
];

interface PenilaianForm {
  kehadiran: DevCategory | null;
  keaktifan: DevCategory | null;
  pemahaman: DevCategory | null;
  partisipasi: DevCategory | null;
  komitmen: DevCategory | null;
  catatan: string;
}

export default function MentorEvaluasiPage() {
  const { mentorProfile } = useAuthStore();
  const { evaluasiList, addEvaluasi, getExistingEvaluasiKeys } = useEvaluasiStore();
  const { menteeList } = useMenteeStore();
  const { kelompokList } = useKelompokStore();
  const { pertemuanList } = usePertemuanStore();
  const { addToast } = useToastStore();

  const [selectedPertemuan, setSelectedPertemuan] = useState('');
  const [expandedMentee, setExpandedMentee] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, PenilaianForm>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingSaves, setPendingSaves] = useState<{ menteeId: string; form: PenilaianForm }[]>([]);

  const myGroup = kelompokList.find((k) => k.kelompok_id === mentorProfile?.kelompok_id);
  const myMentees = menteeList.filter(
    (m) => m.kelompok_id === mentorProfile?.kelompok_id && m.status === 'ACTIVE'
  );

  const existingKeys = useMemo(() => {
    if (!selectedPertemuan || !mentorProfile) return new Set<string>();
    return getExistingEvaluasiKeys(selectedPertemuan, mentorProfile.mentor_id);
  }, [selectedPertemuan, mentorProfile, evaluasiList]);

  const getFormForMentee = (menteeId: string): PenilaianForm => {
    return forms[menteeId] || {
      kehadiran: null,
      keaktifan: null,
      pemahaman: null,
      partisipasi: null,
      komitmen: null,
      catatan: '',
    };
  };

  const updateForm = (menteeId: string, field: string, value: DevCategory | string) => {
    setForms((prev) => ({
      ...prev,
      [menteeId]: {
        ...getFormForMentee(menteeId),
        [field]: value,
      },
    }));
  };

  const isFormComplete = (form: PenilaianForm): boolean => {
    return (
      form.kehadiran !== null &&
      form.keaktifan !== null &&
      form.pemahaman !== null &&
      form.partisipasi !== null &&
      form.komitmen !== null
    );
  };

  const handleSaveOne = (menteeId: string) => {
    const form = getFormForMentee(menteeId);
    if (!isFormComplete(form) || !mentorProfile || !selectedPertemuan) return;

    addEvaluasi({
      mentee_id: menteeId,
      mentor_id: mentorProfile.mentor_id,
      pertemuan_id: selectedPertemuan,
      kehadiran: form.kehadiran!,
      keaktifan: form.keaktifan!,
      pemahaman: form.pemahaman!,
      partisipasi: form.partisipasi!,
      komitmen: form.komitmen!,
      catatan: form.catatan,
    });

    addToast('Penilaian berhasil disimpan.', 'success');
    setExpandedMentee(null);
  };

  const handleSaveAll = () => {
    const unscored = myMentees.filter((m) => {
      const form = forms[m.mentee_id];
      return form && isFormComplete(form) && !existingKeys.has(m.mentee_id);
    });

    if (unscored.length === 0) {
      addToast('Tidak ada penilaian baru untuk disimpan.', 'info');
      return;
    }

    setPendingSaves(
      unscored.map((m) => ({ menteeId: m.mentee_id, form: getFormForMentee(m.mentee_id) }))
    );
    setShowSaveConfirm(true);
  };

  const confirmSaveAll = () => {
    if (!mentorProfile || !selectedPertemuan) return;

    pendingSaves.forEach(({ menteeId, form }) => {
      addEvaluasi({
        mentee_id: menteeId,
        mentor_id: mentorProfile.mentor_id,
        pertemuan_id: selectedPertemuan,
        kehadiran: form.kehadiran!,
        keaktifan: form.keaktifan!,
        pemahaman: form.pemahaman!,
        partisipasi: form.partisipasi!,
        komitmen: form.komitmen!,
        catatan: form.catatan,
      });
    });

    addToast(`${pendingSaves.length} penilaian berhasil disimpan!`, 'success');
    setShowSaveConfirm(false);
    setPendingSaves([]);
  };

  const getScoreCount = () => {
    let scored = 0;
    let unscored = 0;
    myMentees.forEach((m) => {
      if (existingKeys.has(m.mentee_id)) {
        scored++;
      } else {
        unscored++;
      }
    });
    return { scored, unscored };
  };

  const counts = getScoreCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evaluasi Penilaian</h1>
        <p className="text-sm text-gray-500 mt-1">
          Nilai perkembangan mentee {myGroup?.nama_kelompok || ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Pertemuan</label>
        <select
          value={selectedPertemuan}
          onChange={(e) => setSelectedPertemuan(e.target.value)}
          className="w-full max-w-md px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Pilih Pertemuan --</option>
          {pertemuanList.map((p) => (
            <option key={p.pertemuan_id} value={p.pertemuan_id}>
              Pertemuan {String(p.pertemuan_ke).padStart(2, '0')} - {p.judul} ({p.tanggal})
            </option>
          ))}
        </select>
      </div>

      {selectedPertemuan && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Mentee</p>
              <p className="text-2xl font-bold text-gray-900">{myMentees.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Sudah Dinilai</p>
              <p className="text-2xl font-bold text-green-600">{counts.scored}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Belum Dinilai</p>
              <p className="text-2xl font-bold text-orange-600">{counts.unscored}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveAll} disabled={counts.unscored === 0}>
              <Save className="h-4 w-4 mr-2" />
              Simpan Semua yang Belum Dinilai
            </Button>
          </div>

          <div className="space-y-3">
            {myMentees.map((mentee) => {
              const isExpanded = expandedMentee === mentee.mentee_id;
              const alreadyScored = existingKeys.has(mentee.mentee_id);
              const form = getFormForMentee(mentee.mentee_id);
              const complete = isFormComplete(form);

              const existingEval = alreadyScored
                ? evaluasiList.find(
                    (e) =>
                      e.mentee_id === mentee.mentee_id &&
                      e.pertemuan_id === selectedPertemuan
                  )
                : null;

              return (
                <div
                  key={mentee.mentee_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedMentee(isExpanded ? null : mentee.mentee_id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          alreadyScored
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {alreadyScored ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          mentee.nama.charAt(0)
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{mentee.nama}</p>
                        <p className="text-xs text-gray-500">{mentee.NIM} | {mentee.prodi}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alreadyScored && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          Sudah Dinilai
                        </span>
                      )}
                      {!alreadyScored && complete && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          Siap Simpan
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {alreadyScored && existingEval ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700 mb-3">Hasil Penilaian:</p>
                          {ASPEK_LIST.map((aspek) => {
                            const val = existingEval[aspek.key as keyof typeof existingEval] as DevCategory;
                            const cat = CATEGORIES.find((c) => c.value === val);
                            return (
                              <div key={aspek.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{aspek.label}</p>
                                  <p className="text-xs text-gray-500">{aspek.desc}</p>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cat?.color || ''}`}>
                                  {DEV_CATEGORY_LABELS[val] || val}
                                </span>
                              </div>
                            );
                          })}
                          {existingEval.catatan && (
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <p className="text-sm font-medium text-gray-700">Catatan:</p>
                              <p className="text-sm text-gray-600 mt-1">{existingEval.catatan}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ASPEK_LIST.map((aspek) => (
                            <div key={aspek.key}>
                              <p className="text-sm font-medium text-gray-700 mb-1">{aspek.label}</p>
                              <p className="text-xs text-gray-500 mb-2">{aspek.desc}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {CATEGORIES.map((cat) => (
                                  <button
                                    key={cat.value}
                                    onClick={() => updateForm(mentee.mentee_id, aspek.key, cat.value)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                      form[aspek.key as keyof PenilaianForm] === cat.value
                                        ? cat.color + ' ring-2 ring-offset-1 ring-blue-400'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    {cat.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</p>
                            <textarea
                              value={form.catatan}
                              onChange={(e) => updateForm(mentee.mentee_id, 'catatan', e.target.value)}
                              placeholder="Tulis catatan tentang perkembangan mentee ini..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleSaveOne(mentee.mentee_id)}
                              disabled={!complete}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Simpan Penilaian
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!selectedPertemuan && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Star className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Pilih Pertemuan untuk Dinilai</h3>
          <p className="text-sm text-gray-500 mt-1">
            Pilih pertemuan di atas untuk mulai menilai mentee
          </p>
        </div>
      )}

      <Modal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        title="Konfirmasi Simpan Penilaian"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Anda akan menyimpan penilaian untuk <strong>{pendingSaves.length}</strong> mentee.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>
              Batal
            </Button>
            <Button onClick={confirmSaveAll}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Ya, Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
