import React from 'react';
import {
    Modal, View, Text, ScrollView, Pressable, Share, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// ─── CertificateModal ─────────────────────────────────────────────────────────
// Exibe certificado visual estilizado com opção de compartilhar
export default function CertificateModal({ visible, onClose, certificate }) {
    if (!certificate) return null;

    const {
        user_name = 'Usuário',
        trail_title = 'Trilha',
        certificate_code = '',
        issued_at = new Date().toISOString(),
    } = certificate;

    const formattedDate = new Date(issued_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const shortCode = typeof certificate_code === 'string'
        ? certificate_code.slice(0, 8).toUpperCase()
        : '';

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🎓 Certificado de Conclusão\n\n${user_name} concluiu a trilha "${trail_title}" no PetClass!\n\nCódigo: ${shortCode}\nData: ${formattedDate}\n\n#PetClass #Gamificação #Treinamento`,
                title: 'Meu Certificado PetClass',
            });
        } catch (e) {
            console.log('Erro ao compartilhar:', e);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 12,
                }}>
                    <Pressable onPress={onClose} hitSlop={10}>
                        <Icon name="x" size={24} color="#1E2D5A" />
                    </Pressable>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E2D5A' }}>
                        Certificado
                    </Text>
                    <Pressable onPress={handleShare} hitSlop={10}>
                        <Icon name="share-2" size={22} color="#129151" />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Certificate Card */}
                    <View style={{
                        width: '100%', borderRadius: 24, overflow: 'hidden',
                        shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
                    }}>
                        <LinearGradient
                            colors={['#064E29', '#0B6E3D', '#129151']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center' }}
                        >
                            {/* Gold ornament top */}
                            <View style={{
                                width: 60, height: 60, borderRadius: 30,
                                backgroundColor: 'rgba(245,158,11,0.2)',
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: 2, borderColor: 'rgba(245,158,11,0.4)',
                                marginBottom: 20,
                            }}>
                                <Icon name="award" size={30} color="#F59E0B" />
                            </View>

                            {/* Title */}
                            <Text style={{
                                fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)',
                                letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                PetClass Academy
                            </Text>
                            <Text style={{
                                fontSize: 24, fontWeight: '900', color: '#FFF',
                                textAlign: 'center', letterSpacing: -0.3, marginBottom: 4,
                            }}>
                                CERTIFICADO
                            </Text>
                            <Text style={{
                                fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
                                textAlign: 'center', marginBottom: 28,
                            }}>
                                de Conclusão
                            </Text>

                            {/* Divider */}
                            <View style={{
                                width: 60, height: 2, backgroundColor: 'rgba(245,158,11,0.5)',
                                borderRadius: 1, marginBottom: 28,
                            }} />

                            {/* Content */}
                            <Text style={{
                                fontSize: 13, color: 'rgba(255,255,255,0.7)',
                                textAlign: 'center', lineHeight: 20, marginBottom: 8,
                            }}>
                                Certificamos que
                            </Text>
                            <Text style={{
                                fontSize: 22, fontWeight: '900', color: '#FFF',
                                textAlign: 'center', marginBottom: 20,
                            }}>
                                {user_name}
                            </Text>
                            <Text style={{
                                fontSize: 14, color: 'rgba(255,255,255,0.7)',
                                textAlign: 'center', lineHeight: 22, marginBottom: 6,
                                paddingHorizontal: 10,
                            }}>
                                concluiu com êxito todas as aulas da trilha
                            </Text>
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                paddingHorizontal: 20, paddingVertical: 10,
                                borderRadius: 14, borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.15)',
                                marginBottom: 28,
                            }}>
                                <Text style={{
                                    fontSize: 16, fontWeight: '800', color: '#FFF',
                                    textAlign: 'center',
                                }}>
                                    "{trail_title}"
                                </Text>
                            </View>

                            {/* Date */}
                            <Text style={{
                                fontSize: 12, color: 'rgba(255,255,255,0.5)',
                                textAlign: 'center', marginBottom: 4,
                            }}>
                                Emitido em
                            </Text>
                            <Text style={{
                                fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)',
                                textAlign: 'center', marginBottom: 24,
                            }}>
                                {formattedDate}
                            </Text>

                            {/* Bottom divider */}
                            <View style={{
                                width: '100%', height: 1,
                                backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16,
                            }} />

                            {/* Code */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="hash" size={12} color="rgba(255,255,255,0.4)" />
                                <Text style={{
                                    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: 2, fontVariant: ['tabular-nums'],
                                }}>
                                    {shortCode}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Action Buttons */}
                    <View style={{ width: '100%', marginTop: 24, gap: 12 }}>
                        <Pressable
                            onPress={handleShare}
                            style={({ pressed }) => ({
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                                backgroundColor: '#129151', borderRadius: 18, paddingVertical: 16,
                                opacity: pressed ? 0.85 : 1,
                                shadowColor: '#129151', shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
                            })}
                        >
                            <Icon name="share-2" size={18} color="#FFF" />
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>
                                Compartilhar Certificado
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => ({
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                                backgroundColor: '#F1F5F9', borderRadius: 18, paddingVertical: 16,
                                borderWidth: 1.5, borderColor: '#E2E8F0',
                                opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>Fechar</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
